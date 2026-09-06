import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { RegisterSchema, LoginSchema } from '@expense-tracker/validators'
import { db } from '../../db/client.js'
import { users } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import { signToken } from '../../utils/jwt.js'
import bcrypt from 'bcryptjs'

export const authRouter = new Hono()

authRouter.post('/register', zValidator('json', RegisterSchema), async (c) => {
  const { name, email, password } = c.req.valid('json')
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) return c.json({ error: 'Email already registered' }, 409)
  const passwordHash = await bcrypt.hash(password, 12)
  const [user] = await db.insert(users).values({ name, email, passwordHash }).returning()
  const token = await signToken({ userId: user.id, email: user.email })
  return c.json({ token, user: { id: user.id, name: user.name, email: user.email } }, 201)
})

authRouter.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401)
  const token = await signToken({ userId: user.id, email: user.email })
  return c.json({ token, user: { id: user.id, name: user.name, email: user.email } })
})
