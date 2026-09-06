import { create } from 'zustand'
import {
  createCategory,
  createTransaction,
  deleteCategory,
  getTransaction,
  listTransactions,
  recentCategories,
  reverseTransaction,
  transactionMeta,
  updateCategory,
} from '../offline/repo'

export interface TransactionItem {
  id: string
  userId: string
  accountId: string
  categoryId: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  note: string | null
  isReversal: boolean
  referenceId: string | null
  transactedAt: string
  createdAt: string
  runningBalance: number
  category: { id: string; name: string; icon: string | null; color: string | null }
  account: { id: string; name: string; type: string }
}

export interface TransactionDetail extends TransactionItem {
  isReversed: boolean
  reversalId: string | null
}

export interface TransactionMeta {
  accounts: Array<{ id: string; name: string; type: string }>
  categories: TransactionCategory[]
}

export interface TransactionCategory {
  id: string
  name: string
  fullName: string
  icon: string | null
  color?: string | null
  type?: 'expense' | 'income' | 'both'
  isSystem: boolean | null
  isSubcategory: boolean
  parentCategoryId?: string | null
  parentName: string | null
  subcategoryCount?: number
}

interface CreateTransactionInput {
  accountId: string
  categoryId: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  note?: string
  transactedAt: string
}

interface TransactionsState {
  items: TransactionItem[]
  meta: TransactionMeta | null
  summary: { totalIncome: number; totalExpense: number; savings: number }
  filters: {
    month: string
    accountId: string | null
    categoryId: string | null
    type: 'DEBIT' | 'CREDIT' | null
    search: string
    page: number
    limit: number
  }
  hasMore: boolean
  isLoading: boolean
  error: string | null
  fetchMeta: () => Promise<void>
  fetchTransactions: (reset?: boolean) => Promise<void>
  fetchTransaction: (id: string) => Promise<TransactionDetail>
  setFilter: (
    key: 'month' | 'accountId' | 'categoryId' | 'type' | 'search',
    value: string | null
  ) => Promise<void>
  clearFilters: () => Promise<void>
  loadMore: () => Promise<void>
  createTransaction: (input: CreateTransactionInput) => Promise<void>
  reverseTransaction: (id: string) => Promise<void>
  createCategory: (input: {
    name: string
    icon?: string
    color?: string
    type?: 'expense' | 'income' | 'both'
    parentCategoryId?: string
  }) => Promise<void>
  updateCategory: (
    id: string,
    input: { name?: string; icon?: string; color?: string }
  ) => Promise<void>
  deleteCategory: (id: string) => Promise<{ deletedSubcategories: number }>
  fetchRecentCategories: () => Promise<TransactionCategory[]>
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  items: [],
  meta: null,
  summary: { totalIncome: 0, totalExpense: 0, savings: 0 },
  filters: {
    month: new Date().toISOString().slice(0, 7),
    accountId: null,
    categoryId: null,
    type: null,
    search: '',
    page: 1,
    limit: 30,
  },
  hasMore: true,
  isLoading: false,
  error: null,

  fetchMeta: async () => {
    try {
      const meta = await transactionMeta()
      set({ meta })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load transaction metadata.' })
    }
  },

  fetchTransactions: async (reset = true) => {
    set({ isLoading: true, error: null })
    try {
      const { filters, items } = get()
      const targetPage = reset ? 1 : filters.page
      const response = await listTransactions({
        ...filters,
        page: targetPage,
      })
      set({
        items: reset ? response.transactions : [...items, ...response.transactions],
        summary: response.summary,
        hasMore: response.pagination.hasMore,
        filters: { ...filters, page: targetPage },
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load transactions.',
      })
    }
  },
  fetchTransaction: async (id) => getTransaction(id),
  setFilter: async (key, value) => {
    const prev = get().filters
    const next = {
      ...prev,
      page: 1,
      month: key === 'month' ? (value ?? prev.month) : prev.month,
      accountId: key === 'accountId' ? value : prev.accountId,
      categoryId: key === 'categoryId' ? value : prev.categoryId,
      type: key === 'type' ? (value as 'DEBIT' | 'CREDIT' | null) : prev.type,
      search: key === 'search' ? (value ?? '') : prev.search,
    }
    set({ filters: next })
    await get().fetchTransactions(true)
  },
  clearFilters: async () => {
    set({
      filters: {
        ...get().filters,
        accountId: null,
        categoryId: null,
        type: null,
        search: '',
        page: 1,
      },
    })
    await get().fetchTransactions(true)
  },
  loadMore: async () => {
    const { hasMore, isLoading, filters } = get()
    if (!hasMore || isLoading) return
    set({ filters: { ...filters, page: filters.page + 1 } })
    await get().fetchTransactions(false)
  },

  createTransaction: async (input) => {
    await createTransaction(input)
    await get().fetchTransactions()
  },

  reverseTransaction: async (id) => {
    await reverseTransaction(id)
    await get().fetchTransactions()
  },

  createCategory: async (input) => {
    await createCategory(input)
    await get().fetchMeta()
  },
  updateCategory: async (id, input) => {
    await updateCategory(id, input)
    await get().fetchMeta()
  },
  deleteCategory: async (id) => {
    const result = await deleteCategory(id)
    await get().fetchMeta()
    return result
  },
  fetchRecentCategories: async () => recentCategories(),
}))
