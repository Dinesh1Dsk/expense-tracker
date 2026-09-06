export type AccountType = 'cash' | 'bank' | 'wallet' | 'credit_card' | 'savings' | 'loan'
export type CategoryType = 'expense' | 'income' | 'both'
export type LedgerType = 'DEBIT' | 'CREDIT'
export type UpcomingType = 'one_time' | 'recurring' | 'emi'
export type UpcomingStatus = 'pending' | 'paid' | 'overdue'

export interface LocalUser {
  id: string
  name: string
  email: string
}

export interface LocalAccount {
  id: string
  userId: string
  name: string
  type: AccountType
  openingBalance: number
  color: string | null
  institutionName: string | null
  creditLimit: number | null
  outstandingBalance: number | null
  accountOrder: number
  isArchived: boolean
  archivedAt: string | null
  createdAt: string
}

export interface LocalCategory {
  id: string
  userId: string | null
  name: string
  icon: string | null
  color: string | null
  type: CategoryType
  parentCategoryId: string | null
  isSystem: boolean
  sortOrder: number
}

export interface LocalTransaction {
  id: string
  userId: string
  accountId: string
  categoryId: string
  amount: number
  type: LedgerType
  note: string | null
  isReversal: boolean
  referenceId: string | null
  transferGroupId: string | null
  transactedAt: string
  createdAt: string
}

export interface LocalBudget {
  id: string
  userId: string
  familyId: string | null
  categoryId: string | null
  month: string
  monthlyLimit: number
  dailyLimit: number | null
  weeklyLimit: number | null
}

export interface LocalUpcoming {
  id: string
  userId: string
  name: string
  amount: number
  type: UpcomingType
  dueDate: string
  status: UpcomingStatus
  accountId: string | null
  categoryId: string | null
  recurrenceDay: number | null
  emiTotalMonths: number | null
  emiPaidMonths: number | null
  note: string | null
}

export interface OfflineDocument {
  version: 1
  user: LocalUser | null
  accounts: LocalAccount[]
  categories: LocalCategory[]
  transactions: LocalTransaction[]
  budgets: LocalBudget[]
  upcoming: LocalUpcoming[]
}

export function emptyDocument(): OfflineDocument {
  return {
    version: 1,
    user: null,
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    upcoming: [],
  }
}
