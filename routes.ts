import Fastify, { FastifyRequest, FastifyInstance, FastifyPluginOptions } from 'fastify'
import querystring from 'node:querystring'
import { add as addToCache, get as getFromCache } from './cache'

import { SearchMoviesQueryString, SearchMoviesQueryStringType, Movie, MovieType, AddMovieBodyType, AddMovieBody } from './ts-schema'

type AuthHeaders = {
  token: string
}

const snakeCaseToCamelCase = (obj: Record<string, any>): Record<string, any> => Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [
    camelCase(k),
    Array.isArray(v) ? v.map(snakeCaseToCamelCase) : typeof v == 'object' ? snakeCaseToCamelCase(v) : v
  ])
)

const camelCase = (s: string) => s.replace(/_(.)/g, (s, c) => c.toUpperCase())

export const routes = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  const { log, getDB } = fastify
  const prisma = getDB()

  fastify.get('/movies', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: Movie
            },
            total: {
              type: 'number'
            }
          }
        }
      },
      querystring: SearchMoviesQueryString
    },
  }, async (req: FastifyRequest<{
    Querystring: SearchMoviesQueryStringType;
  }>, reply) => {
    const url = `${process.env.MOVIES_API}/movies?${querystring.stringify({
      filter: req.query.filter,
      page: req.query.page,
      limit: req.query.limit,
      order: req.query.order,
    })}`

    const storedInCache = getFromCache(url)
    if(storedInCache) {
      log.info('Cache hit.')
      return {
        data: storedInCache,
        total: storedInCache.length
      }
    }

    const response = await fetch(url)
    if(response.status >= 400) {
      reply.status(response.status)
      return {
        message: 'External API return an error'
      }
    }
    const result = await response.json()
    const data = result.data.map((m: MovieType) => snakeCaseToCamelCase(m))
    addToCache(url, data)
    return {
      data,
      total: result.total
    }
  })

  fastify.post('/movies/add', {
    schema: {
      body: AddMovieBody,
      response: {
        200: {
          type: 'object',
          properties: {
            message: {
              type: 'string'
            }
          }
        }
      },
    }
  }, async (req: FastifyRequest<{
    Headers: AuthHeaders
    Body: AddMovieBodyType
  }>, reply) => {
    if(!req.headers.token) {
      reply.status(401)
      return {
        message: 'Invalid token'
      }
    }
    const user = await prisma.user.findFirst({
      where: {
        id: req.body.userId,
        token: req.headers.token,
      },
      include: {
        movies: true
      }
    })
    if(!user) {
      reply.status(401)
      return {
        message: 'Invalid token or userId'
      }
    }
    const response = await fetch(`${process.env.MOVIES_API}/movies/${req.body.movieId}`)
    
    log.info(`Adding movieId ${req.body.movieId} to the list of movies for ${req.body.userId}`)
    const result = snakeCaseToCamelCase(await response.json())
    await prisma.user.update({
      where: {
        id: req.body.userId,
      },
      data: {
        movies: {
          upsert: [{
            where: {
              id: String(result.id)
            }, update: {}, create: {
              id: String(result.id),
              title: result.title,
              releaseDate: new Date(result.releaseDate),
              duration: result.duration,
              coverUrl: result.coverUrl,
              trailerUrl: result.trailerUrl,
              chronology: result.chronology
            } as unknown as MovieType
          }]
        }
      }
    })

    return {
      message: 'Movie added to user\'s list'
    }
  })
}