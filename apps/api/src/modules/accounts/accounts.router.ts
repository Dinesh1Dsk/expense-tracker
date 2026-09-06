import { Hono } from 'hono'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { zValidator } from '@hono/zod-validator'
import {
  CreateAccountSchema,
  ReorderAccountsSchema,
  UpdateAccountSchema,
} from '@expense-tracker/validators'
import { db } from '../../db/client.js'
import { accounts, transactions, upcomingPayments } from '../../db/schema.js'
import { and, asc, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { getAvailableBalance } from '../../utils/balance.engine.js'

export const accountsRouter = new Hono()
accountsRouter.use('*', authMiddleware)

accountsRouter.patch('/reorder', zValidator('json', ReorderAccountsSchema), async (c) => {
  const userId = c.get('userId')
  const { orderedAccountIds } = c.req.valid('json')

  const existing = await db.query.accounts.findMany({
    where: and(eq(accounts.userId, userId), eq(accounts.isArchived, false)),
    columns: { id: true },
  })

  if (existing.length !== orderedAccountIds.length) {
    return c.json({ error: 'Invalid reorder payload.' }, 400)
  }
  const existingIds = new Set(existing.map((account) => account.id))
  if (orderedAccountIds.some((id) => !existingIds.has(id))) {
    return c.json({ error: 'Invalid account ids for reorder.' }, 400)
  }

  await Promise.all(
    orderedAccountIds.map((id, index) =>
      db
        .update(accounts)
        .set({ accountOrder: index + 1 })
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    )
  )

  return c.json({ success: true })
})

accountsRouter.get('/', async (c) => {
  const userId = c.get('userId')

  const list = await db.query.accounts.findMany({
    where: and(eq(accounts.userId, userId), eq(accounts.isArchived, false)),
    orderBy: [asc(accounts.accountOrder), desc(accounts.createdAt)],
  })

  const withBalances = await Promise.all(
    list.map(async (account) => ({
      ...account,
      ...(await getAvailableBalance(userId, account.id)),
    }))
  )

  return c.json(withBalances)
})

accountsRouter.post('/', zValidator('json', CreateAccountSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')
  const [{ count: currentCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.isArchived, false)))

  const [account] = await db
    .insert(accounts)
    .values({
      userId,
      name: body.name,
      type: body.type,
      openingBalance: body.openingBalance,
      accountOrder: Number(currentCount) + 1,
      color: body.color ?? null,
      institutionName: body.institutionName ?? null,
      creditLimit: body.creditLimit ?? null,
      outstandingBalance: body.outstandingBalance ?? null,
    })
    .returning()

  return c.json(account, 201)
})

accountsRouter.patch('/:id', zValidator('json', UpdateAccountSchema), async (c) => {
  const userId = c.get('userId')
  const accountId = c.req.param('id')
  const body = c.req.valid('json')

  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId), eq(accounts.isArchived, false)),
  })
  if (!account) return c.json({ error: 'Account not found' }, 404)

  const [{ count: hasTransactions }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), eq(transactions.userId, userId)))

  if (Number(hasTransactions) > 0 && body.outstandingBalance !== undefined) {
    return c.json({ error: 'Outstanding balance cannot be changed after first transaction.' }, 400)
  }

  const [updated] = await db
    .update(accounts)
    .set({
      name: body.name ?? account.name,
      color: body.color ?? account.color,
      institutionName: body.institutionName ?? account.institutionName,
      creditLimit: body.creditLimit ?? account.creditLimit,
      outstandingBalance: body.outstandingBalance ?? account.outstandingBalance,
    })
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .returning()

  return c.json(updated)
})

accountsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const accountId = c.req.param('id')
  const forceCleanup = c.req.query('forceCleanup') === '1'

  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId), eq(accounts.isArchived, false)),
  })
  if (!account) return c.json({ error: 'Account not found' }, 404)

  const [{ count: linkedUpcoming }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(upcomingPayments)
    .where(
      and(
        eq(upcomingPayments.accountId, accountId),
        eq(upcomingPayments.userId, userId),
        inArray(upcomingPayments.status, ['pending', 'overdue'])
      )
    )
  if (Number(linkedUpcoming) > 0) {
    if (forceCleanup) {
      await db
        .update(upcomingPayments)
        .set({ accountId: null })
        .where(
          and(
            eq(upcomingPayments.accountId, accountId),
            eq(upcomingPayments.userId, userId),
            inArray(upcomingPayments.status, ['pending', 'overdue'])
          )
        )
    } else {
      return c.json(
        {
          error: `Cannot delete account. ${linkedUpcoming} pending upcoming payment(s) are linked.`,
          code: 'ACCOUNT_HAS_PENDING_UPCOMING',
          linkedUpcoming,
        },
        409
      )
    }
  }

  const [{ count: txCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), eq(transactions.userId, userId)))

  await db
    .update(accounts)
    .set({ isArchived: true, archivedAt: new Date() })
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))

  return c.json({
    success: true,
    hadTransactions: Number(txCount) > 0,
    transactionCount: Number(txCount),
    cancelledUpcoming: forceCleanup ? Number(linkedUpcoming) : 0,
  })
})

accountsRouter.get('/:id/balance', async (c) => {
  const userId = c.get('userId')
  const accountId = c.req.param('id')

  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId), eq(accounts.isArchived, false)),
  })

  if (!account) return c.json({ error: 'Account not found' }, 404)

  const balance = await getAvailableBalance(userId, accountId)
  return c.json(balance)
})
