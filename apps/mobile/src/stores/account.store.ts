import { create } from 'zustand'
import { apiRequest } from '../api/client'

export type AccountType = 'cash' | 'bank' | 'wallet' | 'credit_card' | 'savings' | 'loan'

export interface AccountWithBalance {
  id: string
  userId: string
  name: string
  type: AccountType
  openingBalance: number
  color?: string | null
  institutionName?: string | null
  creditLimit?: number | null
  outstandingBalance?: number | null
  createdAt: string
  currentBalance: number
  pendingUpcoming: number
  availableBalance: number
}

interface CreateAccountInput {
  name: string
  type: AccountType
  openingBalance: number
  color?: string
  institutionName?: string
  creditLimit?: number
  outstandingBalance?: number
}

interface AccountState {
  accounts: AccountWithBalance[]
  isLoading: boolean
  error: string | null
  fetchAccounts: () => Promise<void>
  createAccount: (input: CreateAccountInput) => Promise<void>
  updateAccount: (
    id: string,
    input: Partial<Pick<CreateAccountInput, 'name' | 'color' | 'institutionName' | 'creditLimit' | 'outstandingBalance'>>
  ) => Promise<void>
  deleteAccount: (
    id: string,
    options?: { forceCleanup?: boolean }
  ) => Promise<{ hadTransactions: boolean; transactionCount: number; cancelledUpcoming?: number }>
  reorderAccounts: (orderedAccountIds: string[]) => Promise<void>
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null })
    try {
      const accounts = await apiRequest<AccountWithBalance[]>('/accounts')
      set({ accounts, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load accounts.',
      })
    }
  },

  createAccount: async (input) => {
    set({ error: null })
    try {
      await apiRequest<AccountWithBalance>('/accounts', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      await get().fetchAccounts()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create account.',
      })
      throw error
    }
  },

  updateAccount: async (id, input) => {
    set({ error: null })
    try {
      await apiRequest<AccountWithBalance>(`/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
      await get().fetchAccounts()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update account.',
      })
      throw error
    }
  },

  deleteAccount: async (id, options) => {
    set({ error: null })
    try {
      const suffix = options?.forceCleanup ? '?forceCleanup=1' : ''
      const result = await apiRequest<{
        success: boolean
        hadTransactions: boolean
        transactionCount: number
        cancelledUpcoming?: number
      }>(
        `/accounts/${id}${suffix}`,
        { method: 'DELETE' }
      )
      await get().fetchAccounts()
      return {
        hadTransactions: result.hadTransactions,
        transactionCount: result.transactionCount,
        cancelledUpcoming: result.cancelledUpcoming,
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete account.',
      })
      throw error
    }
  },

  reorderAccounts: async (orderedAccountIds) => {
    set({ error: null })
    try {
      await apiRequest('/accounts/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ orderedAccountIds }),
      })
      await get().fetchAccounts()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reorder accounts.',
      })
      throw error
    }
  },
}))
