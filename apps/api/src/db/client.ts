import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env.js'
import * as schema from './schema.js'

function sslOption() {
  if (env.NODE_ENV !== 'production') return undefined

  const url = env.DATABASE_URL
  if (/sslmode=disable/i.test(url)) return false
  // External Render URLs and explicit sslmode=require need TLS.
  // Internal `dpg-*-a` hosts on the private network typically do not.
  if (/sslmode=require|render\.com/i.test(url)) {
    return 'require' as const
  }
  return undefined
}

const queryClient = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'production' ? 10 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: sslOption(),
})

export const db = drizzle(queryClient, { schema })
