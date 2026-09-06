import { beforeEach, describe, expect, it } from 'vitest'
import { resetOfflineDbCache } from './db'
import { memoryPersist, resetMemoryPersist, setPersistAdapter } from './persist'
import {
  createAccount,
  createTransaction,
  initOffline,
  listAccounts,
  listBudgets,
  reportSummary,
  reverseTransaction,
  saveBudget,
  startLocalProfile,
} from './repo'

describe('offline repo v1 flows', () => {
  beforeEach(async () => {
    resetMemoryPersist()
    resetOfflineDbCache()
    setPersistAdapter(memoryPersist)
    await initOffline()
    await startLocalProfile('UAT User')
  })

  it('creates accounts, income/expense, reverse, and budget spend', async () => {
    await createAccount({ name: 'Cash', type: 'cash', openingBalance: 500000 })
    await createAccount({ name: 'Bank', type: 'bank', openingBalance: 2000000 })
    const accounts = await listAccounts()
    const cash = accounts.find((item) => item.name === 'Cash')
    const salary = (await import('./db')).getDocument().categories.find((item) => item.name === 'Salary')
    const food = (await import('./db')).getDocument().categories.find((item) => item.name === 'Food & Dining')
    if (!cash || !salary || !food) throw new Error('seed missing')

    await createTransaction({
      accountId: cash.id,
      categoryId: salary.id,
      amount: 100000,
      type: 'CREDIT',
      transactedAt: new Date().toISOString(),
    })
    await createTransaction({
      accountId: cash.id,
      categoryId: food.id,
      amount: 25000,
      type: 'DEBIT',
      transactedAt: new Date().toISOString(),
    })

    const after = (await listAccounts()).find((item) => item.id === cash.id)
    expect(after?.currentBalance).toBe(575000)

    const { getDocument } = await import('./db')
    const expense = getDocument().transactions.find((tx) => tx.type === 'DEBIT' && !tx.isReversal)
    if (!expense) throw new Error('expense missing')
    await reverseTransaction(expense.id)

    const month = new Date().toISOString().slice(0, 7)
    await saveBudget({ categoryId: food.id, month, monthlyLimit: 150000 })
    await createTransaction({
      accountId: cash.id,
      categoryId: food.id,
      amount: 30000,
      type: 'DEBIT',
      transactedAt: new Date().toISOString(),
    })
    const budgets = await listBudgets(month)
    const foodBudget = budgets.find((item) => item.categoryId === food.id)
    expect(foodBudget?.spent).toBe(30000)
  })

  it('report spend excludes reversals, reversed originals, and transfers', async () => {
    await createAccount({ name: 'Cash', type: 'cash', openingBalance: 500000 })
    const cash = (await listAccounts()).find((item) => item.name === 'Cash')
    const { getDocument, mutateDocument } = await import('./db')
    const salary = getDocument().categories.find((item) => item.name === 'Salary')
    const food = getDocument().categories.find((item) => item.name === 'Food & Dining')
    const transfer = getDocument().categories.find((item) => item.name === 'Transfer')
    if (!cash || !salary || !food || !transfer) throw new Error('seed missing')

    const month = new Date().toISOString().slice(0, 7)
    const transactedAt = new Date().toISOString()

    await createTransaction({
      accountId: cash.id,
      categoryId: salary.id,
      amount: 100000,
      type: 'CREDIT',
      transactedAt,
    })
    await createTransaction({
      accountId: cash.id,
      categoryId: food.id,
      amount: 25000,
      type: 'DEBIT',
      transactedAt,
    })
    const reversed = getDocument().transactions.find((tx) => tx.type === 'DEBIT' && tx.amount === 25000)
    if (!reversed) throw new Error('reversed spend missing')
    await reverseTransaction(reversed.id)

    await createTransaction({
      accountId: cash.id,
      categoryId: food.id,
      amount: 30000,
      type: 'DEBIT',
      transactedAt,
    })
    await createTransaction({
      accountId: cash.id,
      categoryId: transfer.id,
      amount: 50000,
      type: 'DEBIT',
      transactedAt,
    })
    await mutateDocument((doc) => {
      const transferTx = doc.transactions.find(
        (tx) => tx.categoryId === transfer.id && tx.amount === 50000 && tx.type === 'DEBIT'
      )
      if (transferTx) transferTx.transferGroupId = 'xfer-1'
    })

    const report = await reportSummary(month)
    expect(report.expense).toBe(30000)
    expect(report.income).toBe(100000)
    expect(report.savings).toBe(70000)
    expect(report.expensesByCategory).toEqual([
      expect.objectContaining({ name: 'Food & Dining', amount: 30000, percent: 100 }),
    ])
    expect(report.incomeByCategory).toEqual([
      expect.objectContaining({ name: 'Salary', amount: 100000, percent: 100 }),
    ])
    expect(report.expensesByCategory.some((row) => row.name === 'Transfer')).toBe(false)
  })
})
