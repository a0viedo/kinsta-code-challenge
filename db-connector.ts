import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    getDB: () => PrismaClient
  }
}

export const dbConnector: FastifyPluginAsync = fp(async (server, options) => {
  const prisma = new PrismaClient()

  await prisma.$connect()
  server.decorate('getDB', () => prisma)
  server.addHook('onClose', async (server) => {
    await prisma.$disconnect()
  })
})
