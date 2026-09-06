import { serve } from '@hono/node-server'
import { app } from './app.js'
import { env } from './env.js'

serve({ fetch: app.fetch, port: env.PORT }, () => {
  console.log(`✅ API running → http://localhost:${env.PORT}`)
  console.log(`   Health check → http://localhost:${env.PORT}/health`)
})
