import { Hono } from 'hono'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { zValidator } from '@hono/zod-validator'
import { CreateTransactionSchema, TransferTransactionSchema } from '@expense-tracker/validators'
import { db } from '../../db/client.js'
import { accounts, categories, transactions } from '../../db/schema.js'
import { and, asc, desc, eq, gte, ilike, isNull, lte, or, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { assertCanReverse, computeRunningBalancesForAccount } from './transactions.logic.js'

export const transactionsRouter = new Hono()
transactionsRouter.use('*', authMiddleware)

transactionsRouter.get('/meta', async (c) => {
  const userId = c.get('userId')

  const [accountList, categoryList] = await Promise.all([
    db
      .select({ id: accounts.id, name: accounts.name, type: accounts.type })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.createdAt)),
    db
      .select({
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        isSystem: categories.isSystem,
      })
      .from(categories)
      .where(or(eq(categories.userId, userId), isNull(categories.userId))),
  ])

  return c.json({ accounts: accountList, categories: categoryList })
})

transactionsRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month')
  const accountId = c.req.query('accountId')
  const categoryId = c.req.query('categoryId')
  const txType = c.req.query('type')
  const search = c.req.query('search')
  const page = Math.max(1, Number(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') ?? '30')))
  const offset = (page - 1) * limit

  const conditions = [eq(transactions.userId, userId)]
  const searchMode = !!search?.trim()

  if (month && !searchMode) {
    const start = new Date(`${month}-01T00:00:00.000Z`)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
    conditions.push(gte(transactions.transactedAt, start))
    conditions.push(lte(transactions.transactedAt, end))
  }

  if (accountId) conditions.push(eq(transactions.accountId, accountId))
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId))
  if (txType === 'DEBIT' || txType === 'CREDIT') conditions.push(eq(transactions.type, txType))
  if (searchMode) {
    const q = search!.trim()
    const amountPaise = Math.round(Number(q) * 100)
    if (Number.isFinite(amountPaise) && amountPaise > 0) {
      conditions.push(or(ilike(transactions.note, `%${q}%`), eq(transactions.amount, amountPaise))!)
    } else {
      conditions.push(ilike(transactions.note, `%${q}%`))
    }
  }

  const list = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      amount: transactions.amount,
      type: transactions.type,
      note: transactions.note,
      isReversal: transactions.isReversal,
      referenceId: transactions.referenceId,
      transactedAt: transactions.transactedAt,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      accountName: accounts.name,
      accountType: accounts.type,
      openingBalance: accounts.openingBalance,
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(and(...conditions))
    .orderBy(desc(transactions.transactedAt), desc(transactions.createdAt), desc(transactions.id))
    .limit(limit)
    .offset(offset)

  const totalRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(and(...conditions))
  const total = Number(totalRows[0]?.count ?? 0)

  const groupedByAccount = new Map<
    string,
    Array<{
      id: string
      amount: number
      type: 'DEBIT' | 'CREDIT'
      transactedAt: Date
      createdAt: Date
      openingBalance: number
    }>
  >()

  for (const row of list) {
    const bucket = groupedByAccount.get(row.accountId) ?? []
    bucket.push({
      id: row.id,
      amount: row.amount,
      type: row.type,
      transactedAt: row.transactedAt,
      createdAt: row.createdAt,
      openingBalance: row.openingBalance,
    })
    groupedByAccount.set(row.accountId, bucket)
  }

  const runningBalanceById = new Map<string, number>()
  for (const [accId, rows] of groupedByAccount) {
    const oldest = [...rows].sort(
      (a, b) =>
        a.transactedAt.getTime() - b.transactedAt.getTime() ||
        a.createdAt.getTime() - b.createdAt.getTime() ||
        a.id.localeCompare(b.id)
    )
    const startPoint = oldest[0]?.transactedAt
    const baseResult = await db
      .select({
        net: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'CREDIT' THEN ${transactions.amount} ELSE -${transactions.amount} END), 0)`,
      })
      .from(transactions)
      .where(
        and(eq(transactions.userId, userId), eq(transactions.accountId, accId), lte(transactions.transactedAt, startPoint))
      )

    const map = computeRunningBalancesForAccount(
      rows[0]?.openingBalance ?? 0,
      Number(baseResult[0]?.net ?? 0),
      oldest
    )
    for (const [id, value] of map.entries()) runningBalanceById.set(id, value)
  }

  const summaryRows = await db
    .select({
      type: transactions.type,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        month
          ? and(
              gte(transactions.transactedAt, new Date(`${month}-01T00:00:00.000Z`)),
              lte(
                transactions.transactedAt,
                new Date(
                  new Date(`${month}-01T00:00:00.000Z`).getFullYear(),
                  new Date(`${month}-01T00:00:00.000Z`).getMonth() + 1,
                  0,
                  23,
                  59,
                  59,
                  999
                )
              )
            )
          : undefined
      )!
    )
    .groupBy(transactions.type)
  const totalIncome = Number(summaryRows.find((item) => item.type === 'CREDIT')?.total ?? 0)
  const totalExpense = Number(summaryRows.find((item) => item.type === 'DEBIT')?.total ?? 0)

  return c.json({
    transactions: list.map((row) => ({
      id: row.id,
      userId: row.userId,
      accountId: row.accountId,
      categoryId: row.categoryId,
      amount: row.amount,
      type: row.type,
      note: row.note,
      isReversal: row.isReversal,
      referenceId: row.referenceId,
      transactedAt: row.transactedAt,
      createdAt: row.createdAt,
      runningBalance: runningBalanceById.get(row.id) ?? row.openingBalance,
      category: {
        id: row.categoryId,
        name: row.categoryName,
        icon: row.categoryIcon,
        color: row.categoryColor,
      },
      account: {
        id: row.accountId,
        name: row.accountName,
        type: row.accountType,
      },
    })),
    summary: {
      totalIncome,
      totalExpense,
      savings: totalIncome - totalExpense,
    },
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + list.length < total,
    },
  })
})

transactionsRouter.post('/', zValidator('json', CreateTransactionSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')
  const txDate = new Date(body.transactedAt)

  if (Number.isNaN(txDate.getTime())) return c.json({ error: 'Invalid transaction date.' }, 422)
  if (txDate.getTime() > Date.now() + 60_000) {
    return c.json({ error: 'Transaction date cannot be in the future.' }, 422)
  }

  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, body.accountId), eq(accounts.userId, userId)),
  })
  if (!account) return c.json({ error: 'Account not found' }, 404)

  const category = await db.query.categories.findFirst({
    where: and(eq(categories.id, body.categoryId), or(eq(categories.userId, userId), isNull(categories.userId))),
  })
  if (!category) return c.json({ error: 'Category not found' }, 404)

  if (
    (body.type === 'DEBIT' && !['expense', 'both'].includes(category.type)) ||
    (body.type === 'CREDIT' && !['income', 'both'].includes(category.type))
  ) {
    return c.json({ error: 'Selected category is not valid for this transaction type.' }, 422)
  }

  const [tx] = await db
    .insert(transactions)
    .values({
      userId,
      accountId: body.accountId,
      categoryId: body.categoryId,
      amount: body.amount,
      type: body.type,
      note: body.note,
      transactedAt: txDate,
    })
    .returning()

  return c.json(tx, 201)
})

transactionsRouter.get('/summary', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7)
  const start = new Date(`${month}-01T00:00:00.000Z`)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)

  const summaryRows = await db
    .select({
      type: transactions.type,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.transactedAt, start), lte(transactions.transactedAt, end)))
    .groupBy(transactions.type)

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.transactedAt, start), lte(transactions.transactedAt, end)))
  const totalIncome = Number(summaryRows.find((item) => item.type === 'CREDIT')?.total ?? 0)
  const totalExpense = Number(summaryRows.find((item) => item.type === 'DEBIT')?.total ?? 0)

  return c.json({
    month,
    totalIncome,
    totalExpense,
    savings: totalIncome - totalExpense,
    transactionCount: Number(countRows[0]?.count ?? 0),
  })
})

transactionsRouter.get('/:id', async (c) => {
  const userId = c.get('userId')
  const txId = c.req.param('id')
  const tx = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      amount: transactions.amount,
      type: transactions.type,
      note: transactions.note,
      isReversal: transactions.isReversal,
      referenceId: transactions.referenceId,
      transactedAt: transactions.transactedAt,
      createdAt: transactions.createdAt,
      accountName: accounts.name,
      accountType: accounts.type,
      accountOpeningBalance: accounts.openingBalance,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(and(eq(transactions.id, txId), eq(transactions.userId, userId)))
    .limit(1)

  const row = tx[0]
  if (!row) return c.json({ error: 'Transaction not found' }, 404)

  const reversal = await db.query.transactions.findFirst({
    where: and(eq(transactions.referenceId, row.id), eq(transactions.isReversal, true), eq(transactions.userId, userId)),
  })
  const baseRows = await db
    .select({
      net: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'CREDIT' THEN ${transactions.amount} ELSE -${transactions.amount} END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, row.accountId),
        eq(transactions.userId, userId),
        or(
          lte(transactions.transactedAt, row.transactedAt),
          and(eq(transactions.transactedAt, row.transactedAt), lte(transactions.createdAt, row.createdAt))
        )!
      )
    )
  const runningBalance = row.accountOpeningBalance + Number(baseRows[0]?.net ?? 0)

  return c.json({
    id: row.id,
    userId: row.userId,
    accountId: row.accountId,
    categoryId: row.categoryId,
    amount: row.amount,
    type: row.type,
    note: row.note,
    isReversal: row.isReversal,
    referenceId: row.referenceId,
    isReversed: !!reversal,
    reversalId: reversal?.id ?? null,
    transactedAt: row.transactedAt,
    createdAt: row.createdAt,
    runningBalance,
    category: {
      id: row.categoryId,
      name: row.categoryName,
      icon: row.categoryIcon,
      color: row.categoryColor,
    },
    account: {
      id: row.accountId,
      name: row.accountName,
      type: row.accountType,
    },
  })
})

transactionsRouter.post('/:id/reverse', async (c) => {
  const userId = c.get('userId')
  const txId = c.req.param('id')

  const original = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, txId), eq(transactions.userId, userId)),
  })

  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.referenceId, txId), eq(transactions.isReversal, true), eq(transactions.userId, userId)),
  })
  const canReverse = assertCanReverse({
    exists: !!original,
    isReversal: !!original?.isReversal,
    hasExistingReversal: !!existing,
  })
  if (!canReverse.ok) return c.json({ error: canReverse.error }, canReverse.status)

  const [reversed] = await db
    .insert(transactions)
    .values({
      userId,
      familyId: original.familyId,
      accountId: original.accountId,
      categoryId: original.categoryId,
      amount: original.amount,
      type: original.type === 'DEBIT' ? 'CREDIT' : 'DEBIT',
      note: `Reversal of ${original.id}`,
      isReversal: true,
      referenceId: original.id,
      transactedAt: new Date(),
    })
    .returning()

  return c.json(reversed, 201)
})

transactionsRouter.post('/transfer', zValidator('json', TransferTransactionSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  if (body.fromAccountId === body.toAccountId) {
    return c.json({ error: 'Source and destination accounts must differ.' }, 400)
  }

  const accountList = await db.query.accounts.findMany({
    where: and(
      eq(accounts.userId, userId),
      or(eq(accounts.id, body.fromAccountId), eq(accounts.id, body.toAccountId))
    ),
    columns: { id: true },
  })

  if (accountList.length !== 2) return c.json({ error: 'Invalid accounts for transfer.' }, 404)

  const transferCategory = await db.query.categories.findFirst({
    where: and(or(eq(categories.userId, userId), isNull(categories.userId)), eq(categories.name, 'Others')),
  })
  if (!transferCategory) {
    return c.json({ error: 'Missing transfer category. Run category seed first.' }, 409)
  }

  const transferGroupId = randomUUID()
  const transferDate = new Date(body.transactedAt)

  const created = await db
    .insert(transactions)
    .values([
      {
        userId,
        accountId: body.fromAccountId,
        categoryId: transferCategory.id,
        amount: body.amount,
        type: 'DEBIT',
        note: body.note ?? 'Account transfer',
        transactedAt: transferDate,
        transferGroupId,
      },
      {
        userId,
        accountId: body.toAccountId,
        categoryId: transferCategory.id,
        amount: body.amount,
        type: 'CREDIT',
        note: body.note ?? 'Account transfer',
        transactedAt: transferDate,
        transferGroupId,
      },
    ])
    .returning()

  return c.json({ transferGroupId, entries: created }, 201)
})
