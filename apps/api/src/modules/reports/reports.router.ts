import { Hono } from 'hono'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { db } from '../../db/client.js'
import { transactions } from '../../db/schema.js'
import { and, eq, gte, lte, sql } from 'drizzle-orm'

export const reportsRouter = new Hono()
reportsRouter.use('*', authMiddleware)

reportsRouter.get('/monthly', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7)
  const start = new Date(`${month}-01T00:00:00.000Z`)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)

  const rows = await db
    .select({
      type: transactions.type,
      total: sql<number>`COALESCE(SUM(amount), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.isReversal, false),
        gte(transactions.transactedAt, start),
        lte(transactions.transactedAt, end)
      )
    )
    .groupBy(transactions.type)

  const income = Number(rows.find((row) => row.type === 'CREDIT')?.total ?? 0)
  const expense = Number(rows.find((row) => row.type === 'DEBIT')?.total ?? 0)
  return c.json({ month, income, expense, savings: income - expense })
})

reportsRouter.get('/category', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7)
  const start = new Date(`${month}-01T00:00:00.000Z`)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)

  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      total: sql<number>`COALESCE(SUM(amount), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'DEBIT'),
        eq(transactions.isReversal, false),
        gte(transactions.transactedAt, start),
        lte(transactions.transactedAt, end)
      )
    )
    .groupBy(transactions.categoryId)

  return c.json(rows)
})
