import { describe, expect, it } from 'vitest'
import { assertCanReverse, computeRunningBalancesForAccount } from './transactions.logic.js'

describe('computeRunningBalancesForAccount', () => {
  it('computes deterministic running balances in time order', () => {
    const now = new Date('2026-04-22T10:00:00.000Z')
    const rows = [
      {
        id: 'b',
        type: 'DEBIT' as const,
        amount: 1000,
        transactedAt: new Date('2026-04-22T10:02:00.000Z'),
        createdAt: new Date('2026-04-22T10:02:10.000Z'),
      },
      {
        id: 'a',
        type: 'CREDIT' as const,
        amount: 2000,
        transactedAt: new Date('2026-04-22T10:01:00.000Z'),
        createdAt: new Date('2026-04-22T10:01:10.000Z'),
      },
      {
        id: 'c',
        type: 'DEBIT' as const,
        amount: 500,
        transactedAt: now,
        createdAt: new Date('2026-04-22T10:02:20.000Z'),
      },
    ]

    const map = computeRunningBalancesForAccount(10_000, 0, rows)
    expect(map.get('c')).toBe(9_500)
    expect(map.get('a')).toBe(11_500)
    expect(map.get('b')).toBe(10_500)
  })
})

describe('assertCanReverse', () => {
  it('returns 404 for missing transaction', () => {
    const result = assertCanReverse({ exists: false, isReversal: false, hasExistingReversal: false })
    expect(result).toEqual({ ok: false, status: 404, error: 'Transaction not found' })
  })

  it('returns 400 when reversing a reversal', () => {
    const result = assertCanReverse({ exists: true, isReversal: true, hasExistingReversal: false })
    expect(result).toEqual({ ok: false, status: 400, error: 'Cannot reverse a reversal' })
  })

  it('returns 409 when reversal already exists', () => {
    const result = assertCanReverse({ exists: true, isReversal: false, hasExistingReversal: true })
    expect(result).toEqual({ ok: false, status: 409, error: 'Transaction already reversed' })
  })
})
