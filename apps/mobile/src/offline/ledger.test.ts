import { describe, expect, it } from 'vitest'
import {
  assertCanReverse,
  getAccountBalance,
  getAvailableBalance,
  isEffectiveIncome,
  isEffectiveSpend,
} from './ledger'
import type { LocalAccount, LocalTransaction, LocalUpcoming } from './types'

const account: LocalAccount = {
  id: 'acc-1',
  userId: 'user-1',
  name: 'Cash',
  type: 'cash',
  openingBalance: 100000,
  color: null,
  institutionName: null,
  creditLimit: null,
  outstandingBalance: null,
  accountOrder: 1,
  isArchived: false,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function tx(partial: Partial<LocalTransaction> & Pick<LocalTransaction, 'id' | 'amount' | 'type'>): LocalTransaction {
  return {
    userId: 'user-1',
    accountId: 'acc-1',
    categoryId: 'food',
    note: null,
    isReversal: false,
    referenceId: null,
    transferGroupId: null,
    transactedAt: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
    ...partial,
  }
}

describe('offline ledger', () => {
  it('computes balance from opening + ledger, not a stored field', () => {
    const transactions = [
      tx({ id: 't1', type: 'CREDIT', amount: 50000 }),
      tx({ id: 't2', type: 'DEBIT', amount: 20000 }),
    ]
    expect(getAccountBalance(account, transactions)).toBe(130000)
  })

  it('subtracts pending upcoming from available balance', () => {
    const upcoming: LocalUpcoming[] = [
      {
        id: 'u1',
        userId: 'user-1',
        name: 'Rent',
        amount: 10000,
        type: 'one_time',
        dueDate: '2026-09-10T00:00:00.000Z',
        status: 'pending',
        accountId: 'acc-1',
        categoryId: null,
        recurrenceDay: null,
        emiTotalMonths: null,
        emiPaidMonths: null,
        note: null,
      },
    ]
    const result = getAvailableBalance(account, [], upcoming)
    expect(result.currentBalance).toBe(100000)
    expect(result.availableBalance).toBe(90000)
  })

  it('does not count reversals or reversed originals as spend', () => {
    const transactions = [
      tx({ id: 't1', type: 'DEBIT', amount: 25000 }),
      tx({ id: 't2', type: 'CREDIT', amount: 25000, isReversal: true, referenceId: 't1' }),
    ]
    expect(isEffectiveSpend(transactions[0], transactions)).toBe(false)
    expect(isEffectiveSpend(transactions[1], transactions)).toBe(false)
  })

  it('does not count transfer debits as spend', () => {
    const transfer = tx({ id: 't3', type: 'DEBIT', amount: 50000, transferGroupId: 'g1' })
    expect(isEffectiveSpend(transfer, [transfer])).toBe(false)
  })

  it('does not count reversals or transfer credits as income', () => {
    const salary = tx({ id: 'c1', type: 'CREDIT', amount: 100000, categoryId: 'salary' })
    const reversal = tx({ id: 'c2', type: 'CREDIT', amount: 25000, isReversal: true, referenceId: 't1' })
    const transfer = tx({ id: 'c3', type: 'CREDIT', amount: 50000, transferGroupId: 'g1' })
    expect(isEffectiveIncome(salary, [salary])).toBe(true)
    expect(isEffectiveIncome(reversal, [reversal])).toBe(false)
    expect(isEffectiveIncome(transfer, [transfer])).toBe(false)
  })

  it('blocks reversing a reversal', () => {
    expect(assertCanReverse({ exists: true, isReversal: true, hasExistingReversal: false }).ok).toBe(false)
    expect(assertCanReverse({ exists: true, isReversal: false, hasExistingReversal: true }).ok).toBe(false)
    expect(assertCanReverse({ exists: true, isReversal: false, hasExistingReversal: false }).ok).toBe(true)
  })
})
