import fastify from 'fastify'
import * as dotenv from 'dotenv'
import path from 'path'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { routes } from './routes'
import { dbConnector } from './db-connector'

dotenv.config({ path: path.resolve(__dirname, './.env') })

const app = fastify({
  logger: true
}).withTypeProvider<TypeBoxTypeProvider>()

app.register(dbConnector)
app.register(routes)

app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' }, err => {
  if (err) throw err
})