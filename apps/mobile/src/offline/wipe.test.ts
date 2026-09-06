import { beforeEach, describe, expect, it } from 'vitest'
import { getDocument, resetOfflineDb, resetOfflineDbCache } from './db'
import { memoryPersist, resetMemoryPersist, setPersistAdapter } from './persist'
import { createAccount, createTransaction, initOffline, startLocalProfile } from './repo'

describe('offline wipe', () => {
  beforeEach(async () => {
    resetMemoryPersist()
    resetOfflineDbCache()
    setPersistAdapter(memoryPersist)
    await initOffline()
    await startLocalProfile('Wipe User')
  })

  it('reset/wipe clears user and transactions from the local document', async () => {
    await createAccount({ name: 'Cash', type: 'cash', openingBalance: 100000 })
    const account = getDocument().accounts[0]
    const food = getDocument().categories.find((item) => item.name === 'Food & Dining')
    if (!account || !food) throw new Error('seed missing')

    await createTransaction({
      accountId: account.id,
      categoryId: food.id,
      amount: 2500,
      type: 'DEBIT',
      transactedAt: new Date().toISOString(),
    })

    expect(getDocument().user?.name).toBe('Wipe User')
    expect(getDocument().transactions).toHaveLength(1)

    await resetOfflineDb()

    const raw = await memoryPersist.read()
    expect(raw).toBeTruthy()
    const persisted = JSON.parse(raw!) as { user: unknown; transactions: unknown[] }
    expect(persisted.user).toBeNull()
    expect(persisted.transactions).toEqual([])

    await initOffline()
    expect(getDocument().user).toBeNull()
    expect(getDocument().transactions).toEqual([])
    expect(getDocument().accounts).toEqual([])
  })
})
