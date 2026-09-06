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

  const existingNames = new Set(existing.map((item) => item.name.toLowerCase()))
  const missing = SYSTEM_CATEGORIES.filter(
    (item) => !existingNames.has(item.name.toLowerCase())
  )

  if (missing.length === 0) {
    console.log('System categories already seeded.')
    return
  }

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

seedSystemCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed categories:', error)
    process.exit(1)
  })
