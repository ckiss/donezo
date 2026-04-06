import { resolve } from 'path'
import { buildApp } from './app.ts'

const app = await buildApp()

// In production, serve the built frontend
if (process.env.NODE_ENV === 'production') {
  const fastifyStatic = await import('@fastify/static')
  await app.register(fastifyStatic.default, {
    root: resolve(import.meta.dirname, '../dist'),
    prefix: '/',
    cacheControl: false,
    setHeaders(res, filepath) {
      if (filepath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
      }
    },
  })

  // SPA fallback — serve index.html for non-API routes
  app.setNotFoundHandler(async (_request, reply) => {
    return reply.sendFile('index.html')
  })
}

const port = Number(process.env.PORT) || 3000

try {
  await app.listen({ port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
