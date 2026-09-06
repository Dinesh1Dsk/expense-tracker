import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Comma-separated browser origins. Native mobile clients omit Origin and are unaffected.
    CORS_ORIGIN: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') return

    if (/change-this|placeholder|secret-min-32|dev-secret/i.test(data.JWT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'must be a strong random value in production (min 32 characters)',
      })
    }

    try {
      const { hostname } = new URL(data.DATABASE_URL)
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message: 'must not point at localhost in production',
        })
      }
    } catch {
      // DATABASE_URL is already validated as a URL
    }
  })

const parsed = EnvSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid env vars:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data

export function corsAllowlist(): string[] {
  return env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
}
