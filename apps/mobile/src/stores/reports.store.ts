import { create } from 'zustand'
import { reportSummary, type ReportSummary } from '../offline/repo'

interface ReportsState {
  month: string
  summary: ReportSummary | null
  isLoading: boolean
  error: string | null
  setMonth: (month: string) => void
  fetchReport: () => Promise<void>
}

const currentMonth = new Date().toISOString().slice(0, 7)

export const useReportsStore = create<ReportsState>((set, get) => ({
  month: currentMonth,
  summary: null,
  isLoading: false,
  error: null,
  setMonth: (month) => set({ month }),

  fetchReport: async () => {
    const { month } = get()
    set({ isLoading: true, error: null })
    try {
      const summary = await reportSummary(month)
      set({ summary, isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load report.',
      })
    }
  },
}))
