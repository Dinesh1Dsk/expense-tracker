export type TransactionType = 'DEBIT' | 'CREDIT'
export interface Transaction {
  id: string
  userId: string
  familyId: string | null
  accountId: string
  categoryId: string
  amount: number
  type: TransactionType
  note: string | null
  isReversal: boolean
  referenceId: string | null
  transactedAt: Date
  createdAt: Date
}
