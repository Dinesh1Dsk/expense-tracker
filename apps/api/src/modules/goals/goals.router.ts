import { Hono } from 'hono'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { zValidator } from '@hono/zod-validator'
import { CreateGoalSchema, UpdateGoalProgressSchema } from '@expense-tracker/validators'
import { db } from '../../db/client.js'
import { savingsGoals } from '../../db/schema.js'
import { and, eq } from 'drizzle-orm'

export const goalsRouter = new Hono()
goalsRouter.use('*', authMiddleware)

goalsRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const rows = await db.query.savingsGoals.findMany({
    where: eq(savingsGoals.userId, userId),
  })
  return c.json(rows)
})

goalsRouter.post('/', zValidator('json', CreateGoalSchema), async (c) => {
  const userId = c.get('userId')
  const payload = c.req.valid('json')

  const [created] = await db
    .insert(savingsGoals)
    .values({
      userId,
      name: payload.name,
      type: payload.type,
      targetAmount: payload.targetAmount,
      savedAmount: payload.savedAmount ?? 0,
      deadline: payload.deadline ? payload.deadline.slice(0, 10) : null,
      accountId: payload.accountId ?? null,
    })
    .returning()
  return c.json(created, 201)
})

goalsRouter.patch('/:id/progress', zValidator('json', UpdateGoalProgressSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const payload = c.req.valid('json')

  const [updated] = await db
    .update(savingsGoals)
    .set({ savedAmount: payload.savedAmount })
    .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
    .returning()

  if (!updated) return c.json({ error: 'Goal not found' }, 404)
  return c.json(updated)
})
