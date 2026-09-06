export type AccountType = 'cash' | 'bank' | 'wallet' | 'credit_card' | 'savings' | 'loan'
export interface Account {
  id: string
  userId: string
  name: string
  type: AccountType
  openingBalance: number
  accountOrder: number
  color?: string | null
  institutionName?: string | null
  creditLimit?: number | null
  outstandingBalance?: number | null
  isArchived: boolean
  archivedAt?: Date | null
  currentBalance: number
  createdAt: Date
}
