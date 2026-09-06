export type LedgerTx = {
  id: string
  type: 'DEBIT' | 'CREDIT'
  amount: number
  transactedAt: Date
  createdAt: Date
}

export function computeRunningBalancesForAccount(
  openingBalance: number,
  baseNetBeforeWindow: number,
  rows: LedgerTx[]
) {
  const sorted = [...rows].sort(
    (a, b) =>
      a.transactedAt.getTime() - b.transactedAt.getTime() ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a.id.localeCompare(b.id)
  )
  let running = openingBalance + baseNetBeforeWindow
  const byId = new Map<string, number>()
  for (const tx of sorted) {
    running += tx.type === 'CREDIT' ? tx.amount : -tx.amount
    byId.set(tx.id, running)
  }
  return byId
}

export function assertCanReverse(params: {
  exists: boolean
  isReversal: boolean
  hasExistingReversal: boolean
}) {
  if (!params.exists) return { ok: false as const, status: 404, error: 'Transaction not found' }
  if (params.isReversal) return { ok: false as const, status: 400, error: 'Cannot reverse a reversal' }
  if (params.hasExistingReversal)
    return { ok: false as const, status: 409, error: 'Transaction already reversed' }
  return { ok: true as const }
}
