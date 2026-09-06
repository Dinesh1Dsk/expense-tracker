import { Hono } from 'hono'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { zValidator } from '@hono/zod-validator'
import { SetSalarySchema } from '@expense-tracker/validators'
import { db } from '../../db/client.js'
import { salaries } from '../../db/schema.js'
import { desc, eq } from 'drizzle-orm'

export const salaryRouter = new Hono()
salaryRouter.use('*', authMiddleware)

salaryRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const rows = await db.query.salaries.findMany({
    where: eq(salaries.userId, userId),
    orderBy: [desc(salaries.effectiveFrom), desc(salaries.createdAt)],
  })
  return c.json(rows)
})

salaryRouter.post('/', zValidator('json', SetSalarySchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  const [created] = await db
    .insert(salaries)
    .values({
      userId,
      grossAmount: body.grossAmount,
      pfDeduction: body.pfDeduction,
      taxDeduction: body.taxDeduction,
      otherDeductions: body.otherDeductions,
      payDay: body.payDay,
      accountId: body.accountId,
      effectiveFrom: body.effectiveFrom.slice(0, 10),
    })
    .returning()

  const netAmount =
    created.grossAmount - created.pfDeduction - created.taxDeduction - created.otherDeductions

  return c.json({ ...created, netAmount }, 201)
})
