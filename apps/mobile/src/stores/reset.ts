import { useAccountStore } from './account.store'
import { useBudgetStore } from './budget.store'
import { useReportsStore } from './reports.store'
import { useTransactionsStore } from './transactions.store'
import { useUpcomingStore } from './upcoming.store'

export function resetDataStores() {
  useAccountStore.setState({ accounts: [], isLoading: false, error: null })
  useTransactionsStore.setState({
    items: [],
    meta: null,
    summary: { totalIncome: 0, totalExpense: 0, savings: 0 },
    hasMore: true,
    isLoading: false,
    error: null,
  })
  useBudgetStore.setState({
    items: [],
    summary: null,
    categories: [],
    isLoading: false,
    error: null,
  })
  useUpcomingStore.setState({
    items: [],
    totalPending: 0,
    pendingCount: 0,
    overdueCount: 0,
    homeSummary: null,
    isLoading: false,
    error: null,
  })
  useReportsStore.setState({ summary: null, isLoading: false, error: null })
}
