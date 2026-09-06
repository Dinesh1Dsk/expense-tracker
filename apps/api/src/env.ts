import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

const parsed = EnvSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid env vars:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
