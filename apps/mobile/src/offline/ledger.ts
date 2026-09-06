import type { LocalAccount, LocalTransaction, LocalUpcoming } from './types'

export function assertCanReverse(params: {
  exists: boolean
  isReversal: boolean
  hasExistingReversal: boolean
}) {
  if (!params.exists) return { ok: false as const, error: 'Transaction not found' }
  if (params.isReversal) return { ok: false as const, error: 'Cannot reverse a reversal' }
  if (params.hasExistingReversal) return { ok: false as const, error: 'Transaction already reversed' }
  return { ok: true as const }
}

export function netForTransaction(tx: Pick<LocalTransaction, 'type' | 'amount'>): number {
  return tx.type === 'CREDIT' ? tx.amount : -tx.amount
}

/** Balance = openingBalance + SUM(CREDIT) - SUM(DEBIT). Never persist this. */
export function getAccountBalance(account: LocalAccount, transactions: LocalTransaction[], asOf?: string): number {
  const asOfMs = asOf ? new Date(asOf).getTime() : Number.POSITIVE_INFINITY
  const net = transactions
    .filter((tx) => tx.accountId === account.id && new Date(tx.transactedAt).getTime() <= asOfMs)
    .reduce((sum, tx) => sum + netForTransaction(tx), 0)
  return account.openingBalance + net
}

export function getAvailableBalance(
  account: LocalAccount,
  transactions: LocalTransaction[],
  upcoming: LocalUpcoming[]
) {
  const currentBalance = getAccountBalance(account, transactions)
  const pendingUpcoming = upcoming
    .filter(
      (item) =>
        item.accountId === account.id && (item.status === 'pending' || item.status === 'overdue')
    )
    .reduce((sum, item) => sum + item.amount, 0)
  return {
    currentBalance,
    pendingUpcoming,
    availableBalance: currentBalance - pendingUpcoming,
  }
}

export function isEffectiveSpend(tx: LocalTransaction, all: LocalTransaction[]): boolean {
  if (tx.type !== 'DEBIT') return false
  if (tx.isReversal) return false
  if (tx.transferGroupId) return false
  if (all.some((other) => other.isReversal && other.referenceId === tx.id)) return false
  return true
}

export function isEffectiveIncome(tx: LocalTransaction, all: LocalTransaction[]): boolean {
  if (tx.type !== 'CREDIT') return false
  if (tx.isReversal) return false
  if (tx.transferGroupId) return false
  if (all.some((other) => other.isReversal && other.referenceId === tx.id)) return false
  return true
}

export function monthBounds(month: string) {
  const start = new Date(`${month}-01T00:00:00.000Z`)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function inMonth(iso: string, month: string): boolean {
  const { start, end } = monthBounds(month)
  const ms = new Date(iso).getTime()
  return ms >= start.getTime() && ms <= end.getTime()
}

export function computeRunningBalancesForAccount(
  openingBalance: number,
  rows: Array<{ id: string; type: 'DEBIT' | 'CREDIT'; amount: number; transactedAt: string; createdAt: string }>
) {
  const sorted = [...rows].sort(
    (a, b) =>
      new Date(a.transactedAt).getTime() - new Date(b.transactedAt).getTime() ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
      a.id.localeCompare(b.id)
  )
  let running = openingBalance
  const byId = new Map<string, number>()
  for (const tx of sorted) {
    running += tx.type === 'CREDIT' ? tx.amount : -tx.amount
    byId.set(tx.id, running)
  }
  return byId
}

export function computeNextDueDate(recurrenceDay: number, fromDate: Date) {
  const next = new Date(fromDate)
  next.setMonth(next.getMonth() + 1)
  next.setDate(Math.min(recurrenceDay, 28))
  next.setHours(0, 0, 0, 0)
  return next
}
