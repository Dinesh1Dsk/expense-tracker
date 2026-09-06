import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { CreateCategorySchema, UpdateCategorySchema } from '@expense-tracker/validators'
import { db } from '../../db/client.js'
import { budgets, categories, transactions } from '../../db/schema.js'
import { and, desc, eq, isNull, ne, or } from 'drizzle-orm'

export const categoriesRouter = new Hono()
categoriesRouter.use('*', authMiddleware)

categoriesRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const requestedType = c.req.query('type')

  const rows = await db.query.categories.findMany({
    where: or(eq(categories.userId, userId), isNull(categories.userId)),
    orderBy: [desc(categories.isSystem), categories.sortOrder, categories.name],
  })

  const decorated = rows.map((row) => {
    const parent = row.parentCategoryId ? rows.find((item) => item.id === row.parentCategoryId) : null
    return {
      ...row,
      fullName: parent ? `${parent.name} > ${row.name}` : row.name,
      isSubcategory: !!row.parentCategoryId,
      parentName: parent?.name ?? null,
      subcategoryCount: rows.filter((item) => item.parentCategoryId === row.id).length,
    }
  })

  const filtered =
    requestedType && ['expense', 'income', 'both'].includes(requestedType)
      ? decorated.filter((row) => row.type === requestedType || row.type === 'both')
      : decorated

  return c.json(filtered)
})

categoriesRouter.post('/', zValidator('json', CreateCategorySchema), async (c) => {
  const userId = c.get('userId')
  const payload = c.req.valid('json')

  if (payload.parentCategoryId) {
    const parent = await db.query.categories.findFirst({
      where: and(
        eq(categories.id, payload.parentCategoryId),
        or(eq(categories.userId, userId), isNull(categories.userId))
      ),
    })
    if (!parent) return c.json({ error: 'Parent category not found' }, 404)
    if (parent.parentCategoryId) return c.json({ error: 'Only one subcategory level is allowed.' }, 400)

    const [createdSubcategory] = await db
      .insert(categories)
      .values({
        userId,
        name: payload.name.trim(),
        icon: parent.icon ?? payload.icon ?? null,
        color: parent.color,
        type: parent.type,
        parentCategoryId: payload.parentCategoryId,
        isSystem: false,
      })
      .returning()

    return c.json(createdSubcategory, 201)
  }

  const [created] = await db
    .insert(categories)
    .values({
      userId,
      name: payload.name.trim(),
      icon: payload.icon ?? null,
      color: payload.color ?? '#1D9E75',
      type: payload.type ?? 'expense',
      parentCategoryId: payload.parentCategoryId ?? null,
      isSystem: false,
    })
    .returning()

  return c.json(created, 201)
})

categoriesRouter.patch('/:id', zValidator('json', UpdateCategorySchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const payload = c.req.valid('json')

  const category = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.userId, userId)),
  })

  if (!category) return c.json({ error: 'Category not found' }, 404)
  if (category.isSystem) return c.json({ error: 'System category cannot be edited.' }, 400)

  const updatePayload = category.parentCategoryId
    ? { name: payload.name?.trim() }
    : { name: payload.name?.trim(), icon: payload.icon, color: payload.color }

  const [updated] = await db
    .update(categories)
    .set(updatePayload)
    .where(eq(categories.id, id))
    .returning()

  return c.json(updated)
})

categoriesRouter.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const category = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.userId, userId)),
  })

  if (!category) return c.json({ error: 'Category not found' }, 404)
  if (category.isSystem) return c.json({ error: 'System category cannot be deleted.' }, 400)

  const blockedByTransactions = await db.query.transactions.findFirst({
    where: and(eq(transactions.categoryId, id), eq(transactions.userId, userId)),
    columns: { id: true },
  })
  if (blockedByTransactions) {
    return c.json({ error: 'Cannot delete category with existing transactions.' }, 400)
  }

  const blockedByBudget = await db.query.budgets.findFirst({
    where: and(eq(budgets.categoryId, id), eq(budgets.userId, userId)),
    columns: { id: true },
  })
  if (blockedByBudget) {
    return c.json({ error: 'Cannot delete category linked to a budget.' }, 400)
  }

  const children = await db.query.categories.findMany({
    where: and(eq(categories.parentCategoryId, id), eq(categories.userId, userId)),
  })

  if (children.length > 0) {
    const childIds = children.map((item) => item.id)
    const childTransaction = await db.query.transactions.findFirst({
      where: and(or(...childIds.map((childId) => eq(transactions.categoryId, childId))), eq(transactions.userId, userId)),
      columns: { id: true },
    })
    if (childTransaction) {
      return c.json({ error: 'Cannot delete category because a subcategory has transactions.' }, 400)
    }

    await db.delete(categories).where(and(or(...childIds.map((childId) => eq(categories.id, childId))), eq(categories.userId, userId)))
  }

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)))
  return c.json({ success: true, deletedSubcategories: children.length })
})

categoriesRouter.get('/recent', async (c) => {
  const userId = c.get('userId')
  const recentTransactions = await db.query.transactions.findMany({
    where: and(eq(transactions.userId, userId), ne(transactions.isReversal, true)),
    orderBy: [desc(transactions.transactedAt)],
    columns: { categoryId: true },
    limit: 50,
  })

  const recentIds: string[] = []
  for (const tx of recentTransactions) {
    if (!recentIds.includes(tx.categoryId)) recentIds.push(tx.categoryId)
    if (recentIds.length === 5) break
  }
  if (recentIds.length === 0) return c.json([])

  const rows = await db.query.categories.findMany({
    where: and(or(...recentIds.map((id) => eq(categories.id, id))), or(eq(categories.userId, userId), isNull(categories.userId))),
  })
  const byId = new Map(rows.map((row) => [row.id, row]))
  return c.json(recentIds.map((id) => byId.get(id)).filter(Boolean))
})
