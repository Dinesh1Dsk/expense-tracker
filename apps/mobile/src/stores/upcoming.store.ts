import { create } from 'zustand'
import { apiRequest } from '../api/client'

export interface UpcomingPaymentItem {
  id: string
  name: string
  amount: number
  type: 'one_time' | 'recurring' | 'emi'
  dueDate: string
  status: 'pending' | 'paid' | 'overdue'
  accountId?: string | null
}

interface UpcomingState {
  items: UpcomingPaymentItem[]
  totalPending: number
  pendingCount: number
  overdueCount: number
  homeSummary: {
    topPayments: UpcomingPaymentItem[]
    totalCount: number
    totalCommitted: number
    overdueCount: number
  } | null
  isLoading: boolean
  error: string | null
  fetchUpcoming: () => Promise<void>
  fetchHomeSummary: () => Promise<void>
  createPayment: (input: {
    name: string
    amount: number
    type: 'one_time' | 'recurring' | 'emi'
    dueDate?: string
    recurrenceDay?: number
    emiTotalMonths?: number
    emiPaidMonths?: number
    accountId?: string
    categoryId?: string
    note?: string
  }) => Promise<void>
  markPaid: (id: string, accountId?: string) => Promise<void>
  skipPayment: (id: string) => Promise<void>
  deletePayment: (id: string) => Promise<void>
}

export const useUpcomingStore = create<UpcomingState>((set, get) => ({
  items: [],
  totalPending: 0,
  pendingCount: 0,
  overdueCount: 0,
  homeSummary: null,
  isLoading: false,
  error: null,
  fetchUpcoming: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiRequest<{
        emis: UpcomingPaymentItem[]
        recurring: UpcomingPaymentItem[]
        onetime: UpcomingPaymentItem[]
        paid: UpcomingPaymentItem[]
        summary: { totalCommitted: number; pendingCount: number; overdueCount: number }
      }>(
        '/upcoming-payments'
      )
      const items = [...data.emis, ...data.recurring, ...data.onetime, ...data.paid].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )
      set({
        items,
        totalPending: data.summary.totalCommitted,
        pendingCount: data.summary.pendingCount,
        overdueCount: data.summary.overdueCount,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load upcoming payments.',
      })
    }
  },
  createPayment: async (input) => {
    await apiRequest('/upcoming-payments', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    await get().fetchUpcoming()
    await get().fetchHomeSummary()
  },
  markPaid: async (id, accountId) => {
    await apiRequest(`/upcoming-payments/${id}/mark-paid`, {
      method: 'PATCH',
      body: JSON.stringify(accountId ? { accountId } : {}),
    })
    await get().fetchUpcoming()
    await get().fetchHomeSummary()
  },
  fetchHomeSummary: async () => {
    try {
      const data = await apiRequest<{
        topPayments: UpcomingPaymentItem[]
        totalCount: number
        totalCommitted: number
        overdueCount: number
      }>('/upcoming-payments/home-summary')
      set({ homeSummary: data })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load upcoming summary.' })
    }
  },
  skipPayment: async (id) => {
    await apiRequest(`/upcoming-payments/${id}/skip`, { method: 'PATCH' })
    await get().fetchUpcoming()
    await get().fetchHomeSummary()
  },
  deletePayment: async (id) => {
    await apiRequest(`/upcoming-payments/${id}`, { method: 'DELETE' })
    await get().fetchUpcoming()
    await get().fetchHomeSummary()
  },
}))
