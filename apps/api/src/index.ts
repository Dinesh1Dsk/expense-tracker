import { serve } from '@hono/node-server'
import { app } from './app.js'
import { env } from './env.js'

const hostname = '0.0.0.0'

const server = serve({ fetch: app.fetch, port: env.PORT, hostname }, (info) => {
  console.log(`API listening on ${info.address}:${info.port} (${env.NODE_ENV})`)
  console.log('Health check → /health')
})

const shutdown = () => {
  server.close((error) => {
    if (error) {
      console.error('Error during shutdown:', error)
      process.exit(1)
    }
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
