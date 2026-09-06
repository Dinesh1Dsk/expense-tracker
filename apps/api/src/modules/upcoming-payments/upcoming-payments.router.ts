import { Hono } from 'hono'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { db } from '../../db/client.js'
import { accounts, upcomingPayments } from '../../db/schema.js'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { zValidator } from '@hono/zod-validator'
import { CreateUpcomingPaymentSchema } from '@expense-tracker/validators'

export const upcomingPaymentsRouter = new Hono()
upcomingPaymentsRouter.use('*', authMiddleware)

// GET /upcoming-payments — list all + forecast
upcomingPaymentsRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return c.json({ error: 'Invalid month format. Use YYYY-MM' }, 422)
  }
  const monthStart = new Date(`${month}-01T00:00:00.000Z`)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)
  const items = await db.query.upcomingPayments.findMany({
    where: and(
      eq(upcomingPayments.userId, userId),
      gte(upcomingPayments.dueDate, monthStart),
      lte(upcomingPayments.dueDate, monthEnd)
    ),
    orderBy: (u, { asc }) => asc(u.dueDate),
  })
  const active = items.filter((i) => i.status === 'pending' || i.status === 'overdue')
  const emis = active.filter((i) => i.type === 'emi')
  const recurring = active.filter((i) => i.type === 'recurring')
  const onetime = active.filter((i) => i.type === 'one_time')
  const paid = items.filter((i) => i.status === 'paid')
  const totalCommitted = active.reduce((sum, i) => sum + i.amount, 0)
  const pendingCount = items.filter((i) => i.status === 'pending').length
  const overdueCount = items.filter((i) => i.status === 'overdue').length

  return c.json({
    emis,
    recurring,
    onetime,
    paid,
    summary: { totalCommitted, pendingCount, overdueCount },
  })
})

// POST /upcoming-payments
upcomingPaymentsRouter.post('/', zValidator('json', CreateUpcomingPaymentSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')
  let dueDate: Date
  if (body.type === 'one_time') {
    dueDate = new Date(body.dueDate!)
    if (Number.isNaN(dueDate.getTime())) return c.json({ error: 'Invalid due date' }, 422)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (dueDate < today) return c.json({ error: 'Due date must be today or in the future' }, 422)
  } else {
    const day = body.recurrenceDay!
    dueDate = computeNextDueDate(day, new Date())
  }
  const [item] = await db
    .insert(upcomingPayments)
    .values({
      userId,
      name: body.name,
      amount: body.amount,
      type: body.type,
      dueDate,
      status: 'pending',
      accountId: body.accountId ?? null,
      categoryId: body.categoryId ?? null,
      recurrenceDay: body.recurrenceDay ?? null,
      emiTotalMonths: body.emiTotalMonths ?? null,
      emiPaidMonths: body.emiPaidMonths ?? 0,
      note: body.note ?? null,
    })
    .returning()
  return c.json(item, 201)
})

// PATCH /upcoming-payments/:id/mark-paid
upcomingPaymentsRouter.patch('/:id/mark-paid', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { accountId?: string }
  const payment = await db.query.upcomingPayments.findFirst({
    where: and(eq(upcomingPayments.id, id), eq(upcomingPayments.userId, userId)),
  })
  if (!payment) return c.json({ error: 'Payment not found' }, 404)
  if (payment.status === 'paid') return c.json({ error: 'Already paid' }, 400)
  const chosenAccountId = body.accountId ?? payment.accountId ?? null
  if (!chosenAccountId) return c.json({ error: 'Select account before marking paid' }, 400)
  const accountExists = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, chosenAccountId), eq(accounts.userId, userId), eq(accounts.isArchived, false)),
    columns: { id: true },
  })
  if (!accountExists) return c.json({ error: 'Account not found' }, 404)

  const nextEmiPaidMonths = payment.type === 'emi' ? (payment.emiPaidMonths ?? 0) + 1 : payment.emiPaidMonths
  const [updated] = await db
    .update(upcomingPayments)
    .set({
      status: 'paid',
      accountId: chosenAccountId,
      emiPaidMonths: nextEmiPaidMonths ?? null,
    })
    .where(and(eq(upcomingPayments.id, id), eq(upcomingPayments.userId, userId)))
    .returning()

  if (updated.type === 'recurring' && updated.recurrenceDay) {
    const nextDue = computeNextDueDate(updated.recurrenceDay, updated.dueDate)
    const existingNext = await db.query.upcomingPayments.findFirst({
      where: and(
        eq(upcomingPayments.userId, userId),
        eq(upcomingPayments.type, 'recurring'),
        eq(upcomingPayments.name, updated.name),
        eq(upcomingPayments.dueDate, nextDue),
        inArray(upcomingPayments.status, ['pending', 'overdue'])
      ),
      columns: { id: true },
    })
    if (!existingNext) {
      await db.insert(upcomingPayments).values({
        userId,
        name: updated.name,
        amount: updated.amount,
        type: updated.type,
        dueDate: nextDue,
        status: 'pending',
        accountId: chosenAccountId,
        categoryId: updated.categoryId,
        recurrenceDay: updated.recurrenceDay,
        note: updated.note,
      })
    }
  }

  if (updated.type === 'emi' && updated.emiTotalMonths) {
    const paidMonths = nextEmiPaidMonths ?? 0
    if (paidMonths < updated.emiTotalMonths) {
      const nextDue = computeNextDueDate(updated.recurrenceDay ?? updated.dueDate.getDate(), updated.dueDate)
      const existingNext = await db.query.upcomingPayments.findFirst({
        where: and(
          eq(upcomingPayments.userId, userId),
          eq(upcomingPayments.type, 'emi'),
          eq(upcomingPayments.name, updated.name),
          eq(upcomingPayments.dueDate, nextDue),
          inArray(upcomingPayments.status, ['pending', 'overdue'])
        ),
        columns: { id: true },
      })
      if (!existingNext) {
        await db.insert(upcomingPayments).values({
          userId,
          name: updated.name,
          amount: updated.amount,
          type: updated.type,
          dueDate: nextDue,
          status: 'pending',
          accountId: chosenAccountId,
          categoryId: updated.categoryId,
          recurrenceDay: updated.recurrenceDay,
          emiTotalMonths: updated.emiTotalMonths,
          emiPaidMonths: paidMonths,
          note: updated.note,
        })
      }
    }
  }

  return c.json(updated)
})

// GET /upcoming-payments/home-summary
upcomingPaymentsRouter.get('/home-summary', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return c.json({ error: 'Invalid month format. Use YYYY-MM' }, 422)
  }
  const monthStart = new Date(`${month}-01T00:00:00.000Z`)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)

  const all = await db.query.upcomingPayments.findMany({
    where: and(
      eq(upcomingPayments.userId, userId),
      inArray(upcomingPayments.status, ['pending', 'overdue']),
      gte(upcomingPayments.dueDate, monthStart),
      lte(upcomingPayments.dueDate, monthEnd)
    ),
    orderBy: (u, { asc }) => asc(u.dueDate),
  })

  return c.json({
    topPayments: all.slice(0, 3),
    totalCount: all.length,
    totalCommitted: all.reduce((sum, item) => sum + item.amount, 0),
    overdueCount: all.filter((item) => item.status === 'overdue').length,
  })
})

// GET /upcoming-payments/:id
upcomingPaymentsRouter.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const payment = await db.query.upcomingPayments.findFirst({
    where: and(eq(upcomingPayments.id, id), eq(upcomingPayments.userId, userId)),
  })
  if (!payment) return c.json({ error: 'Payment not found' }, 404)
  return c.json(payment)
})

// PATCH /upcoming-payments/:id/skip
upcomingPaymentsRouter.patch('/:id/skip', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const payment = await db.query.upcomingPayments.findFirst({
    where: and(eq(upcomingPayments.id, id), eq(upcomingPayments.userId, userId)),
  })
  if (!payment) return c.json({ error: 'Payment not found' }, 404)
  if (payment.type === 'one_time') return c.json({ error: 'Cannot skip one-time payments' }, 400)
  if (payment.status === 'paid') return c.json({ error: 'Already paid' }, 400)

  // Current schema has no "skipped" status, so skip means close this cycle as paid without accounting entry.
  const [updated] = await db
    .update(upcomingPayments)
    .set({ status: 'paid' })
    .where(and(eq(upcomingPayments.id, id), eq(upcomingPayments.userId, userId)))
    .returning()

  const nextDue = computeNextDueDate(updated.recurrenceDay ?? updated.dueDate.getDate(), updated.dueDate)
  const existingNext = await db.query.upcomingPayments.findFirst({
    where: and(
      eq(upcomingPayments.userId, userId),
      eq(upcomingPayments.type, updated.type),
      eq(upcomingPayments.name, updated.name),
      eq(upcomingPayments.dueDate, nextDue),
      inArray(upcomingPayments.status, ['pending', 'overdue'])
    ),
    columns: { id: true },
  })

  let next: typeof updated | null = null
  if (!existingNext) {
    ;[next] = await db
      .insert(upcomingPayments)
      .values({
        userId,
        name: updated.name,
        amount: updated.amount,
        type: updated.type,
        dueDate: nextDue,
        status: 'pending',
        accountId: updated.accountId,
        categoryId: updated.categoryId,
        recurrenceDay: updated.recurrenceDay,
        emiTotalMonths: updated.emiTotalMonths,
        emiPaidMonths: updated.emiPaidMonths,
        note: updated.note,
      })
      .returning()
  }
  return c.json({ updated, next })
})

// DELETE /upcoming-payments/:id
upcomingPaymentsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const existing = await db.query.upcomingPayments.findFirst({
    where: and(eq(upcomingPayments.id, id), eq(upcomingPayments.userId, userId)),
    columns: { id: true },
  })
  if (!existing) return c.json({ error: 'Payment not found' }, 404)
  await db.delete(upcomingPayments).where(and(eq(upcomingPayments.id, id), eq(upcomingPayments.userId, userId)))
  return c.json({ deleted: true })
})

function computeNextDueDate(recurrenceDay: number, fromDate: Date) {
  const next = new Date(fromDate)
  next.setMonth(next.getMonth() + 1)
  next.setDate(Math.min(recurrenceDay, 28))
  next.setHours(0, 0, 0, 0)
  return next
}
