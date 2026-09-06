import { createMiddleware } from 'hono/factory'
import { verifyToken } from '../../utils/jwt.js'

export const authMiddleware = createMiddleware<{
  Variables: { userId: string; email: string }
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const token = authHeader.slice(7)
    const payload = await verifyToken(token)
    c.set('userId', payload.userId)
    c.set('email', payload.email)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
})
