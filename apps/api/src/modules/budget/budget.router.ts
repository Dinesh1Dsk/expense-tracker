import { Hono } from 'hono'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { zValidator } from '@hono/zod-validator'
import { SetBudgetSchema } from '@expense-tracker/validators'
import { db } from '../../db/client.js'
import { budgets, categories, familyMembers, transactions, users } from '../../db/schema.js'
import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm'

export const budgetRouter = new Hono()
budgetRouter.use('*', authMiddleware)

budgetRouter.get('/meta', async (c) => {
  const userId = c.get('userId')

  const availableCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      isSystem: categories.isSystem,
    })
    .from(categories)
    .where(and(orUserOrSystem(userId)))

  return c.json({ categories: availableCategories })
})

budgetRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7)
  const isFamily = c.req.query('isFamily') === 'true'
  if (!isValidMonth(month)) {
    return c.json({ error: 'Invalid month format. Use YYYY-MM' }, 422)
  }
  const scope = await resolveBudgetScope(userId, isFamily, false)
  if (!scope.ok) {
    if (isFamily && scope.status === 404) return c.json([])
    return c.json({ error: scope.error }, scope.status)
  }

  const budgetRows = await db
    .select({
      id: budgets.id,
      familyId: budgets.familyId,
      categoryId: budgets.categoryId,
      month: budgets.month,
      monthlyLimit: budgets.monthlyLimit,
      dailyLimit: budgets.dailyLimit,
      weeklyLimit: budgets.weeklyLimit,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(budgets)
    .leftJoin(categories, eq(categories.id, budgets.categoryId))
    .where(
      and(
        scope.familyId ? eq(budgets.familyId, scope.familyId) : eq(budgets.userId, userId),
        scope.familyId ? sql`true` : isNull(budgets.familyId),
        eq(budgets.month, month)
      )
    )

  const monthStart = new Date(`${month}-01T00:00:00.000Z`)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)

  const spentRows = await db
    .select({
      categoryId: transactions.categoryId,
      spent: sql<number>`COALESCE(SUM(amount), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        scope.familyId ? eq(transactions.familyId, scope.familyId) : isNull(transactions.familyId),
        eq(transactions.type, 'DEBIT'),
        eq(transactions.isReversal, false),
        gte(transactions.transactedAt, monthStart),
        lte(transactions.transactedAt, monthEnd)
      )
    )
    .groupBy(transactions.categoryId)

  const spentByCategory = new Map(spentRows.map((row) => [row.categoryId, Number(row.spent ?? 0)]))

  const response = budgetRows
    .map((row) => {
    const spent = row.categoryId
      ? (spentByCategory.get(row.categoryId) ?? 0)
      : Array.from(spentByCategory.values()).reduce((sum, value) => sum + value, 0)
    const remaining = Math.max(0, row.monthlyLimit - spent)
    const percentUsed = row.monthlyLimit > 0 ? Math.round((spent / row.monthlyLimit) * 100) : 0

    return {
      ...row,
      spent,
      remaining,
      percentUsed,
    }
  })
    .sort((a, b) => {
      if (a.categoryId === null && b.categoryId !== null) return -1
      if (a.categoryId !== null && b.categoryId === null) return 1
      return (a.categoryName ?? '').localeCompare(b.categoryName ?? '')
    })

  return c.json(response)
})

budgetRouter.post('/', zValidator('json', SetBudgetSchema), async (c) => {
  const userId = c.get('userId')
  const payload = c.req.valid('json')
  const scope = await resolveBudgetScope(userId, payload.isFamily === true, true)
  if (!scope.ok) return c.json({ error: scope.error }, scope.status)

  const existing = await db.query.budgets.findFirst({
    where: and(
      scope.familyId ? eq(budgets.familyId, scope.familyId) : eq(budgets.userId, userId),
      scope.familyId ? sql`true` : isNull(budgets.familyId),
      eq(budgets.month, payload.month),
      payload.categoryId ? eq(budgets.categoryId, payload.categoryId) : isNull(budgets.categoryId)
    ),
  })

  if (existing) {
    const [updated] = await db
      .update(budgets)
      .set({
        categoryId: payload.categoryId,
        month: payload.month,
        monthlyLimit: payload.monthlyLimit,
        dailyLimit: payload.dailyLimit ?? null,
        weeklyLimit: payload.weeklyLimit ?? null,
        familyId: scope.familyId ?? null,
      })
      .where(eq(budgets.id, existing.id))
      .returning()

    return c.json(updated)
  }

  const [created] = await db
    .insert(budgets)
    .values({
      userId,
      familyId: scope.familyId ?? null,
      categoryId: payload.categoryId,
      month: payload.month,
      monthlyLimit: payload.monthlyLimit,
      dailyLimit: payload.dailyLimit ?? null,
      weeklyLimit: payload.weeklyLimit ?? null,
    })
    .returning()

  return c.json(created, 201)
})

budgetRouter.get('/summary', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7)
  const isFamily = c.req.query('isFamily') === 'true'
  if (!isValidMonth(month)) {
    return c.json({ error: 'Invalid month format. Use YYYY-MM' }, 422)
  }
  const scope = await resolveBudgetScope(userId, isFamily, false)
  if (!scope.ok) {
    if (isFamily && scope.status === 404) {
      return c.json({ month, hasOverallBudget: false })
    }
    return c.json({ error: scope.error }, scope.status)
  }

  const overall = await db.query.budgets.findFirst({
    where: and(
      scope.familyId ? eq(budgets.familyId, scope.familyId) : eq(budgets.userId, userId),
      scope.familyId ? sql`true` : isNull(budgets.familyId),
      eq(budgets.month, month),
      isNull(budgets.categoryId)
    ),
  })
  if (!overall) {
    return c.json({ month, hasOverallBudget: false })
  }

  const monthStart = new Date(`${month}-01T00:00:00.000Z`)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)

  const [spendRow] = await db
    .select({ spent: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        scope.familyId ? eq(transactions.familyId, scope.familyId) : isNull(transactions.familyId),
        eq(transactions.type, 'DEBIT'),
        eq(transactions.isReversal, false),
        gte(transactions.transactedAt, monthStart),
        lte(transactions.transactedAt, monthEnd)
      )
    )

  const spent = Number(spendRow?.spent ?? 0)
  const percentUsed = overall.monthlyLimit > 0 ? Math.round((spent / overall.monthlyLimit) * 100) : 0
  const status = percentUsed >= 100 ? 'exceeded' : percentUsed >= 80 ? 'warning' : 'on_track'
  return c.json({
    month,
    hasOverallBudget: true,
    monthlyLimit: overall.monthlyLimit,
    spent,
    percentUsed,
    status,
  })
})

budgetRouter.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const existing = await db.query.budgets.findFirst({
    where: eq(budgets.id, id),
    columns: { id: true, userId: true, familyId: true },
  })
  if (!existing) return c.json({ error: 'Budget not found' }, 404)
  if (!existing.familyId && existing.userId !== userId) return c.json({ error: 'Budget not found' }, 404)
  if (existing.familyId) {
    const owner = await db.query.familyMembers.findFirst({
      where: and(
        eq(familyMembers.familyId, existing.familyId),
        eq(familyMembers.userId, userId),
        eq(familyMembers.role, 'owner')
      ),
      columns: { userId: true },
    })
    if (!owner) return c.json({ error: 'Only family owner can manage family budget' }, 403)
  }

  await db.delete(budgets).where(eq(budgets.id, id))
  return c.json({ success: true })
})

function orUserOrSystem(userId: string) {
  return sql`${categories.userId} = ${userId} OR ${categories.userId} IS NULL`
}

function isValidMonth(month: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
}

async function resolveBudgetScope(userId: string, isFamily: boolean, requireOwner: boolean) {
  if (!isFamily) return { ok: true as const, familyId: null as string | null }
  const me = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { familyId: true },
  })
  if (!me?.familyId) return { ok: false as const, status: 404, error: 'No family found' }
  if (!requireOwner) return { ok: true as const, familyId: me.familyId }
  const membership = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.familyId, me.familyId),
      eq(familyMembers.userId, userId),
      eq(familyMembers.role, 'owner')
    ),
    columns: { userId: true },
  })
  if (!membership) {
    return { ok: false as const, status: 403, error: 'Only family owner can manage family budget' }
  }
  return { ok: true as const, familyId: me.familyId }
}
