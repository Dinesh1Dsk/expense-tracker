import { Hono } from 'hono'
import { authMiddleware } from '../../common/middleware/auth.middleware.js'
import { db } from '../../db/client.js'
import { families, familyMembers, users } from '../../db/schema.js'
import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const familyRouter = new Hono()
familyRouter.use('*', authMiddleware)

familyRouter.post('/create', async (c) => {
  const userId = c.get('userId')
  const { name } = await c.req.json()

  const [created] = await db
    .insert(families)
    .values({ name, ownerId: userId, inviteToken: nanoid(10) })
    .returning()

  await db.insert(familyMembers).values({
    familyId: created.id,
    userId,
    role: 'owner',
  })
  await db.update(users).set({ familyId: created.id }).where(eq(users.id, userId))

  return c.json(created, 201)
})

familyRouter.post('/invite', async (c) => {
  const userId = c.get('userId')
  const me = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!me?.familyId) return c.json({ error: 'No family found' }, 404)

  const family = await db.query.families.findFirst({ where: eq(families.id, me.familyId) })
  if (!family) return c.json({ error: 'Family not found' }, 404)

  return c.json({ inviteToken: family.inviteToken })
})

familyRouter.post('/join', async (c) => {
  const userId = c.get('userId')
  const { inviteToken } = await c.req.json()

  const family = await db.query.families.findFirst({ where: eq(families.inviteToken, inviteToken) })
  if (!family) return c.json({ error: 'Invalid invite token' }, 404)

  const existing = await db.query.familyMembers.findFirst({
    where: and(eq(familyMembers.familyId, family.id), eq(familyMembers.userId, userId)),
  })
  if (existing) return c.json({ error: 'Already a family member' }, 409)

  await db.insert(familyMembers).values({ familyId: family.id, userId, role: 'member' })
  await db.update(users).set({ familyId: family.id }).where(eq(users.id, userId))

  return c.json({ success: true, familyId: family.id })
})

familyRouter.get('/dashboard', async (c) => {
  const userId = c.get('userId')
  const me = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!me?.familyId) return c.json({ error: 'No family found' }, 404)

  const members = await db.query.familyMembers.findMany({
    where: eq(familyMembers.familyId, me.familyId),
  })

  return c.json({ familyId: me.familyId, memberCount: members.length, members })
})

familyRouter.get('/me', async (c) => {
  const userId = c.get('userId')
  const me = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { familyId: true } })
  if (!me?.familyId) return c.json({ inFamily: false, role: null })

  const membership = await db.query.familyMembers.findFirst({
    where: and(eq(familyMembers.familyId, me.familyId), eq(familyMembers.userId, userId)),
    columns: { role: true },
  })

  return c.json({
    inFamily: true,
    familyId: me.familyId,
    role: membership?.role ?? 'member',
    canManageBudget: membership?.role === 'owner',
  })
})
