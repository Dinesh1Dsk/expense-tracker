import { create } from 'zustand'
import { deleteBudget, listBudgets, listCategories, saveBudget, budgetSummary } from '../offline/repo'

export interface BudgetItem {
  id: string
  familyId?: string | null
  categoryId: string | null
  month: string
  monthlyLimit: number
  dailyLimit: number | null
  weeklyLimit: number | null
  categoryName: string | null
  categoryIcon: string | null
  spent: number
  remaining: number
  percentUsed: number
}

interface BudgetCategory {
  id: string
  name: string
  icon: string | null
  isSystem: boolean | null
}

interface BudgetState {
  items: BudgetItem[]
  summary: {
    hasOverallBudget: boolean
    month: string
    monthlyLimit?: number
    spent?: number
    percentUsed?: number
    status?: 'on_track' | 'warning' | 'exceeded'
  } | null
  categories: BudgetCategory[]
  month: string
  isFamily: boolean
  canManageFamilyBudget: boolean
  familyRole: 'owner' | 'member' | null
  isLoading: boolean
  error: string | null
  setMonth: (month: string) => void
  setScope: (isFamily: boolean) => void
  fetchMeta: () => Promise<void>
  fetchFamilyAccess: () => Promise<void>
  fetchBudgets: () => Promise<void>
  fetchSummary: () => Promise<void>
  saveBudget: (input: {
    categoryId: string | null
    month: string
    monthlyLimit: number
    dailyLimit?: number
    weeklyLimit?: number
  }) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
}

const currentMonth = new Date().toISOString().slice(0, 7)

export const useBudgetStore = create<BudgetState>((set, get) => ({
  items: [],
  summary: null,
  categories: [],
  month: currentMonth,
  isFamily: false,
  canManageFamilyBudget: true,
  familyRole: null,
  isLoading: false,
  error: null,
  setMonth: (month) => set({ month }),
  setScope: () => set({ isFamily: false }),

  fetchMeta: async () => {
    try {
      const categories = await listCategories()
      set({
        categories: categories.map((item) => ({
          id: item.id,
          name: item.name,
          icon: item.icon,
          isSystem: item.isSystem,
        })),
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load budget metadata.' })
    }
  },
  fetchFamilyAccess: async () => {
    set({ canManageFamilyBudget: false, familyRole: null, isFamily: false })
  },

  fetchBudgets: async () => {
    const { month } = get()
    set({ isLoading: true, error: null })
    try {
      const items = await listBudgets(month)
      set({ items, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load budgets.',
      })
    }
  },
  fetchSummary: async () => {
    const { month } = get()
    try {
      const summary = await budgetSummary(month)
      set({ summary })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load budget summary.' })
    }
  },

  saveBudget: async (input) => {
    await saveBudget(input)
    await get().fetchBudgets()
    await get().fetchSummary()
  },

  deleteBudget: async (id) => {
    await deleteBudget(id)
    await get().fetchBudgets()
    await get().fetchSummary()
  },
}))
