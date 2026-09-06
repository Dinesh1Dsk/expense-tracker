import { create } from 'zustand'
import { apiRequest } from '../api/client'

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
  setScope: (isFamily) => set({ isFamily }),

  fetchMeta: async () => {
    try {
      const data = await apiRequest<{ categories: BudgetCategory[] }>('/budgets/meta')
      set({ categories: data.categories })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load budget metadata.' })
    }
  },
  fetchFamilyAccess: async () => {
    try {
      const data = await apiRequest<{
        inFamily: boolean
        role: 'owner' | 'member' | null
        canManageBudget: boolean
      }>('/family/me')
      set({
        canManageFamilyBudget: data.inFamily ? data.canManageBudget : false,
        familyRole: data.inFamily ? data.role : null,
      })
    } catch {
      set({ canManageFamilyBudget: false, familyRole: null })
    }
  },

  fetchBudgets: async () => {
    const { month, isFamily } = get()
    set({ isLoading: true, error: null })
    try {
      const items = await apiRequest<BudgetItem[]>(`/budgets?month=${month}&isFamily=${isFamily}`)
      set({ items, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load budgets.',
      })
    }
  },
  fetchSummary: async () => {
    const { month, isFamily } = get()
    try {
      const summary = await apiRequest<{
        hasOverallBudget: boolean
        month: string
        monthlyLimit?: number
        spent?: number
        percentUsed?: number
        status?: 'on_track' | 'warning' | 'exceeded'
      }>(`/budgets/summary?month=${month}&isFamily=${isFamily}`)
      set({ summary })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load budget summary.' })
    }
  },

  saveBudget: async (input) => {
    const { isFamily, canManageFamilyBudget } = get()
    if (isFamily && !canManageFamilyBudget) {
      throw new Error('Only family owner can manage family budget')
    }
    await apiRequest('/budgets', {
      method: 'POST',
      body: JSON.stringify({ ...input, isFamily }),
    })
    await get().fetchBudgets()
    await get().fetchSummary()
  },

  deleteBudget: async (id) => {
    const { isFamily, canManageFamilyBudget } = get()
    if (isFamily && !canManageFamilyBudget) {
      throw new Error('Only family owner can manage family budget')
    }
    await apiRequest(`/budgets/${id}`, { method: 'DELETE' })
    await get().fetchBudgets()
    await get().fetchSummary()
  },
}))
