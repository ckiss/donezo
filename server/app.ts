// Fastify app factory — separated from server start for testability.
// Tests use app.inject() without starting a real server.
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { healthRoutes } from './routes/health.ts'
import { taskRoutes } from './routes/tasks.ts'

export async function buildApp() {
  const app = Fastify({ logger: false })

  await app.register(cors)
  await app.register(healthRoutes)
  await app.register(taskRoutes)

  return app
}
