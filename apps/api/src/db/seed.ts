import { db } from './client.js'
import { categories } from './schema.js'
import { eq } from 'drizzle-orm'

const SYSTEM_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍽️', type: 'expense' },
  { name: 'Transport', icon: '🚗', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', type: 'expense' },
  { name: 'Entertainment', icon: '🎬', type: 'expense' },
  { name: 'Health & Medical', icon: '💊', type: 'expense' },
  { name: 'Education', icon: '📚', type: 'expense' },
  { name: 'Utilities', icon: '💡', type: 'expense' },
  { name: 'Housing', icon: '🏠', type: 'expense' },
  { name: 'Travel', icon: '✈️', type: 'expense' },
  { name: 'Family & Kids', icon: '👨‍👩‍👧', type: 'expense' },
  { name: 'Gifts & Donations', icon: '🎁', type: 'expense' },
  { name: 'Salary', icon: '💰', type: 'income' },
  { name: 'Freelance', icon: '💻', type: 'income' },
  { name: 'Rental Income', icon: '🏘️', type: 'income' },
  { name: 'Investment Returns', icon: '📈', type: 'income' },
  { name: 'Gifts Received', icon: '🎁', type: 'income' },
  { name: 'Transfer', icon: '🔄', type: 'both' },
  { name: 'Adjustment', icon: '⚖️', type: 'both' },
  { name: 'Others', icon: '📦', type: 'both' },
] as const

async function seedSystemCategories() {
  const existing = await db.query.categories.findMany({
    where: eq(categories.isSystem, true),
  })

  const existingByName = new Map(existing.map((item) => [item.name.toLowerCase(), item]))
  const missing = SYSTEM_CATEGORIES.filter((item) => !existingByName.has(item.name.toLowerCase()))
  const mistyped = SYSTEM_CATEGORIES.filter((item) => {
    const row = existingByName.get(item.name.toLowerCase())
    return !!row && row.type !== item.type
  })

  if (missing.length === 0 && mistyped.length === 0) {
    console.log('System categories already seeded.')
    return
  }

  if (missing.length > 0) {
    await db.insert(categories).values(
      missing.map((item) => ({
        name: item.name,
        icon: item.icon,
        type: item.type,
        color: '#1D9E75',
        isSystem: true,
      }))
    )
    console.log(`Seeded ${missing.length} system categories.`)
  }

  for (const item of mistyped) {
    const row = existingByName.get(item.name.toLowerCase())
    if (!row) continue
    await db.update(categories).set({ type: item.type }).where(eq(categories.id, row.id))
    console.log(`Corrected system category type: ${item.name} ${row.type} -> ${item.type}`)
  }
}

seedSystemCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed categories:', error)
    process.exit(1)
  })
