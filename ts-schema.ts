import { Static, Type } from '@sinclair/typebox'

export const User = Type.Object({
  name: Type.String(),
  token: Type.Optional(Type.String({ format: 'email' })),
})

export type UserType = Static<typeof User>

export const SearchMoviesQueryString = Type.Object({
  filter: Type.String(),
  page: Type.String(),
  limit: Type.String(),
  order: Type.String()
})

export type SearchMoviesQueryStringType = Static<typeof SearchMoviesQueryString>

export const Movie = Type.Object({
  id: Type.String(),
  title: Type.String(),
  releaseDate: Type.String(),
  duration: Type.Number(),
  coverUrl: Type.String(),
  trailerUrl: Type.String(),
  chronology: Type.Number()
})

export type MovieType = Static<typeof Movie>

export const AddMovieBody = Type.Object({
  movieId: Type.String(),
  userId: Type.String()
})
export type AddMovieBodyType = Static<typeof AddMovieBody>