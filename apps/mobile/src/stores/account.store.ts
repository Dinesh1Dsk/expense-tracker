import { create } from 'zustand'
import {
  createAccount,
  deleteAccount,
  listAccounts,
  reorderAccounts,
  updateAccount,
} from '../offline/repo'

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
      const accounts = await listAccounts()
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
      await createAccount(input)
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
      await updateAccount(id, input)
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
      const result = await deleteAccount(id, options)
      await get().fetchAccounts()
      return result
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
      await reorderAccounts(orderedAccountIds)
      await get().fetchAccounts()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reorder accounts.',
      })
      throw error
    }
  },
}))
