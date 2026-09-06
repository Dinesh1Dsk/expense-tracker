import { getDocument, hydrateOfflineDb, mutateDocument } from './db'
import { createId } from './ids'
import {
  assertCanReverse,
  computeNextDueDate,
  computeRunningBalancesForAccount,
  getAvailableBalance,
  inMonth,
  isEffectiveIncome,
  isEffectiveSpend,
} from './ledger'
import type {
  AccountType,
  LocalAccount,
  LocalCategory,
  LocalTransaction,
  LocalUpcoming,
} from './types'

function fail(message: string): never {
  throw new Error(message)
}

function decorateCategory(row: LocalCategory, all: LocalCategory[]) {
  const parent = row.parentCategoryId ? all.find((item) => item.id === row.parentCategoryId) : null
  return {
    id: row.id,
    name: row.name,
    fullName: parent ? `${parent.name} > ${row.name}` : row.name,
    icon: row.icon,
    color: row.color,
    type: row.type,
    isSystem: row.isSystem,
    isSubcategory: !!row.parentCategoryId,
    parentCategoryId: row.parentCategoryId,
    parentName: parent?.name ?? null,
    subcategoryCount: all.filter((item) => item.parentCategoryId === row.id).length,
  }
}

function withAccountBalance(account: LocalAccount) {
  const doc = getDocument()
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    type: account.type,
    openingBalance: account.openingBalance,
    color: account.color,
    institutionName: account.institutionName,
    creditLimit: account.creditLimit,
    outstandingBalance: account.outstandingBalance,
    createdAt: account.createdAt,
    ...getAvailableBalance(account, doc.transactions, doc.upcoming),
  }
}

function refreshUpcomingStatus(item: LocalUpcoming): LocalUpcoming {
  if (item.status === 'paid') return item
  const due = new Date(item.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  return { ...item, status: dueStart < today ? 'overdue' : 'pending' }
}

function mapUpcoming(item: LocalUpcoming) {
  const current = refreshUpcomingStatus(item)
  return {
    id: current.id,
    name: current.name,
    amount: current.amount,
    type: current.type,
    dueDate: current.dueDate,
    status: current.status,
    accountId: current.accountId,
  }
}

function toTransactionItem(tx: LocalTransaction, runningBalance: number) {
  const doc = getDocument()
  const category = doc.categories.find((item) => item.id === tx.categoryId)
  const account = doc.accounts.find((item) => item.id === tx.accountId)
  return {
    id: tx.id,
    userId: tx.userId,
    accountId: tx.accountId,
    categoryId: tx.categoryId,
    amount: tx.amount,
    type: tx.type,
    note: tx.note,
    isReversal: tx.isReversal,
    referenceId: tx.referenceId,
    transactedAt: tx.transactedAt,
    createdAt: tx.createdAt,
    runningBalance,
    category: {
      id: tx.categoryId,
      name: category?.name ?? 'Unknown',
      icon: category?.icon ?? null,
      color: category?.color ?? null,
    },
    account: {
      id: tx.accountId,
      name: account?.name ?? 'Unknown',
      type: account?.type ?? 'cash',
    },
  }
}

export async function initOffline(): Promise<void> {
  await hydrateOfflineDb()
}

export function getLocalUser() {
  return getDocument().user
}

export async function startLocalProfile(name: string) {
  const trimmed = name.trim()
  if (!trimmed) fail('Name is required.')
  await mutateDocument((doc) => {
    if (doc.user) return
    doc.user = {
      id: createId(),
      name: trimmed,
      email: 'offline@local',
    }
  })
  return getDocument().user!
}

export async function listAccounts() {
  await hydrateOfflineDb()
  return getDocument()
    .accounts.filter((account) => !account.isArchived)
    .sort((a, b) => a.accountOrder - b.accountOrder || b.createdAt.localeCompare(a.createdAt))
    .map(withAccountBalance)
}

export async function createAccount(input: {
  name: string
  type: AccountType
  openingBalance: number
  color?: string
  institutionName?: string
  creditLimit?: number
  outstandingBalance?: number
}) {
  const user = getLocalUser() ?? fail('Start the app first.')
  await mutateDocument((doc) => {
    const active = doc.accounts.filter((account) => !account.isArchived)
    doc.accounts.push({
      id: createId(),
      userId: user.id,
      name: input.name.trim(),
      type: input.type,
      openingBalance: input.openingBalance,
      color: input.color ?? null,
      institutionName: input.institutionName ?? null,
      creditLimit: input.creditLimit ?? null,
      outstandingBalance: input.outstandingBalance ?? null,
      accountOrder: active.length + 1,
      isArchived: false,
      archivedAt: null,
      createdAt: new Date().toISOString(),
    })
  })
}

export async function updateAccount(
  id: string,
  input: Partial<{ name: string; color: string; institutionName: string; creditLimit: number; outstandingBalance: number }>
) {
  await mutateDocument((doc) => {
    const account = doc.accounts.find((item) => item.id === id && !item.isArchived)
    if (!account) fail('Account not found')
    const hasTx = doc.transactions.some((tx) => tx.accountId === id)
    if (hasTx && input.outstandingBalance !== undefined) {
      fail('Outstanding balance cannot be changed after first transaction.')
    }
    account.name = input.name ?? account.name
    account.color = input.color ?? account.color
    account.institutionName = input.institutionName ?? account.institutionName
    account.creditLimit = input.creditLimit ?? account.creditLimit
    account.outstandingBalance = input.outstandingBalance ?? account.outstandingBalance
  })
}

export async function deleteAccount(id: string, options?: { forceCleanup?: boolean }) {
  let result = { hadTransactions: false, transactionCount: 0, cancelledUpcoming: 0 }
  await mutateDocument((doc) => {
    const account = doc.accounts.find((item) => item.id === id && !item.isArchived)
    if (!account) fail('Account not found')
    const linked = doc.upcoming.filter(
      (item) => item.accountId === id && (item.status === 'pending' || item.status === 'overdue')
    )
    if (linked.length > 0 && !options?.forceCleanup) {
      fail(`Cannot delete account. ${linked.length} pending upcoming payment(s) are linked.`)
    }
    if (options?.forceCleanup) {
      for (const item of linked) item.accountId = null
    }
    const transactionCount = doc.transactions.filter((tx) => tx.accountId === id).length
    account.isArchived = true
    account.archivedAt = new Date().toISOString()
    result = {
      hadTransactions: transactionCount > 0,
      transactionCount,
      cancelledUpcoming: options?.forceCleanup ? linked.length : 0,
    }
  })
  return result
}

export async function reorderAccounts(orderedAccountIds: string[]) {
  await mutateDocument((doc) => {
    const active = doc.accounts.filter((account) => !account.isArchived)
    if (active.length !== orderedAccountIds.length) fail('Invalid reorder payload.')
    const ids = new Set(active.map((account) => account.id))
    if (orderedAccountIds.some((id) => !ids.has(id))) fail('Invalid account ids for reorder.')
    orderedAccountIds.forEach((id, index) => {
      const account = doc.accounts.find((item) => item.id === id)
      if (account) account.accountOrder = index + 1
    })
  })
}

export async function listCategories() {
  await hydrateOfflineDb()
  const rows = getDocument().categories
  return rows
    .slice()
    .sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name))
    .map((row) => decorateCategory(row, rows))
}

export async function createCategory(input: {
  name: string
  icon?: string
  color?: string
  type?: 'expense' | 'income' | 'both'
  parentCategoryId?: string
}) {
  const user = getLocalUser() ?? fail('Start the app first.')
  await mutateDocument((doc) => {
    if (input.parentCategoryId) {
      const parent = doc.categories.find((item) => item.id === input.parentCategoryId)
      if (!parent) fail('Parent category not found')
      if (parent.parentCategoryId) fail('Only one subcategory level is allowed.')
      doc.categories.push({
        id: createId(),
        userId: user.id,
        name: input.name.trim(),
        icon: parent.icon ?? input.icon ?? null,
        color: parent.color,
        type: parent.type,
        parentCategoryId: input.parentCategoryId,
        isSystem: false,
        sortOrder: doc.categories.length,
      })
      return
    }
    doc.categories.push({
      id: createId(),
      userId: user.id,
      name: input.name.trim(),
      icon: input.icon ?? null,
      color: input.color ?? '#1D9E75',
      type: input.type ?? 'expense',
      parentCategoryId: null,
      isSystem: false,
      sortOrder: doc.categories.length,
    })
  })
}

export async function updateCategory(id: string, input: { name?: string; icon?: string; color?: string }) {
  await mutateDocument((doc) => {
    const category = doc.categories.find((item) => item.id === id)
    if (!category) fail('Category not found')
    if (category.isSystem) fail('System category cannot be edited.')
    if (category.parentCategoryId) {
      category.name = input.name?.trim() ?? category.name
      return
    }
    category.name = input.name?.trim() ?? category.name
    category.icon = input.icon ?? category.icon
    category.color = input.color ?? category.color
  })
}

export async function deleteCategory(id: string) {
  let deletedSubcategories = 0
  await mutateDocument((doc) => {
    const category = doc.categories.find((item) => item.id === id)
    if (!category) fail('Category not found')
    if (category.isSystem) fail('System category cannot be deleted.')
    if (doc.transactions.some((tx) => tx.categoryId === id)) {
      fail('Cannot delete category with existing transactions.')
    }
    if (doc.budgets.some((budget) => budget.categoryId === id)) {
      fail('Cannot delete category linked to a budget.')
    }
    const children = doc.categories.filter((item) => item.parentCategoryId === id)
    if (children.some((child) => doc.transactions.some((tx) => tx.categoryId === child.id))) {
      fail('Cannot delete category because a subcategory has transactions.')
    }
    const removeIds = new Set([id, ...children.map((child) => child.id)])
    deletedSubcategories = children.length
    doc.categories = doc.categories.filter((item) => !removeIds.has(item.id))
  })
  return { deletedSubcategories }
}

export async function recentCategories() {
  await hydrateOfflineDb()
  const doc = getDocument()
  const recentIds: string[] = []
  const sorted = [...doc.transactions]
    .filter((tx) => !tx.isReversal)
    .sort((a, b) => b.transactedAt.localeCompare(a.transactedAt))
  for (const tx of sorted) {
    if (!recentIds.includes(tx.categoryId)) recentIds.push(tx.categoryId)
    if (recentIds.length === 5) break
  }
  return recentIds
    .map((id) => doc.categories.find((item) => item.id === id))
    .filter((item): item is LocalCategory => !!item)
    .map((item) => decorateCategory(item, doc.categories))
}

export async function transactionMeta() {
  await hydrateOfflineDb()
  const accounts = getDocument()
    .accounts.filter((account) => !account.isArchived)
    .map((account) => ({ id: account.id, name: account.name, type: account.type }))
  return { accounts, categories: await listCategories() }
}

export async function listTransactions(filters: {
  month: string
  accountId: string | null
  categoryId: string | null
  type: 'DEBIT' | 'CREDIT' | null
  search: string
  page: number
  limit: number
}) {
  await hydrateOfflineDb()
  const doc = getDocument()
  const search = filters.search.trim()
  let rows = [...doc.transactions]

  if (!search && filters.month) {
    rows = rows.filter((tx) => inMonth(tx.transactedAt, filters.month))
  }
  if (filters.accountId) rows = rows.filter((tx) => tx.accountId === filters.accountId)
  if (filters.categoryId) rows = rows.filter((tx) => tx.categoryId === filters.categoryId)
  if (filters.type) rows = rows.filter((tx) => tx.type === filters.type)
  if (search) {
    const amountPaise = Math.round(Number(search) * 100)
    rows = rows.filter((tx) => {
      const noteHit = (tx.note ?? '').toLowerCase().includes(search.toLowerCase())
      const amountHit = Number.isFinite(amountPaise) && amountPaise > 0 && tx.amount === amountPaise
      return noteHit || amountHit
    })
  }

  rows.sort(
    (a, b) =>
      b.transactedAt.localeCompare(a.transactedAt) ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id)
  )

  const total = rows.length
  const offset = (filters.page - 1) * filters.limit
  const pageRows = rows.slice(offset, offset + filters.limit)
  const running = new Map<string, number>()

  for (const account of doc.accounts) {
    const accountRows = doc.transactions.filter((tx) => tx.accountId === account.id)
    const map = computeRunningBalancesForAccount(account.openingBalance, accountRows)
    for (const [id, value] of map) running.set(id, value)
  }

  const monthRows = filters.month
    ? doc.transactions.filter((tx) => inMonth(tx.transactedAt, filters.month))
    : doc.transactions
  const totalIncome = monthRows.filter((tx) => tx.type === 'CREDIT').reduce((sum, tx) => sum + tx.amount, 0)
  const totalExpense = monthRows.filter((tx) => tx.type === 'DEBIT').reduce((sum, tx) => sum + tx.amount, 0)

  return {
    transactions: pageRows.map((tx) => toTransactionItem(tx, running.get(tx.id) ?? 0)),
    summary: { totalIncome, totalExpense, savings: totalIncome - totalExpense },
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasMore: offset + pageRows.length < total,
    },
  }
}

export async function createTransaction(input: {
  accountId: string
  categoryId: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  note?: string
  transactedAt: string
}) {
  const user = getLocalUser() ?? fail('Start the app first.')
  const txDate = new Date(input.transactedAt)
  if (Number.isNaN(txDate.getTime())) fail('Invalid transaction date.')
  if (txDate.getTime() > Date.now() + 60_000) fail('Transaction date cannot be in the future.')

  await mutateDocument((doc) => {
    const account = doc.accounts.find((item) => item.id === input.accountId && !item.isArchived)
    if (!account) fail('Account not found')
    const category = doc.categories.find((item) => item.id === input.categoryId)
    if (!category) fail('Category not found')
    if (
      (input.type === 'DEBIT' && !['expense', 'both'].includes(category.type)) ||
      (input.type === 'CREDIT' && !['income', 'both'].includes(category.type))
    ) {
      fail('Selected category is not valid for this transaction type.')
    }
    doc.transactions.push({
      id: createId(),
      userId: user.id,
      accountId: input.accountId,
      categoryId: input.categoryId,
      amount: input.amount,
      type: input.type,
      note: input.note ?? null,
      isReversal: false,
      referenceId: null,
      transferGroupId: null,
      transactedAt: txDate.toISOString(),
      createdAt: new Date().toISOString(),
    })
  })
}

export async function reverseTransaction(id: string) {
  const user = getLocalUser() ?? fail('Start the app first.')
  await mutateDocument((doc) => {
    const original = doc.transactions.find((tx) => tx.id === id)
    const check = assertCanReverse({
      exists: !!original,
      isReversal: !!original?.isReversal,
      hasExistingReversal: doc.transactions.some((tx) => tx.isReversal && tx.referenceId === id),
    })
    if (!check.ok) fail(check.error)
    const source = original!
    doc.transactions.push({
      id: createId(),
      userId: user.id,
      accountId: source.accountId,
      categoryId: source.categoryId,
      amount: source.amount,
      type: source.type === 'DEBIT' ? 'CREDIT' : 'DEBIT',
      note: source.note ? `Reversal: ${source.note}` : 'Reversal',
      isReversal: true,
      referenceId: source.id,
      transferGroupId: source.transferGroupId,
      transactedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
  })
}

export async function getTransaction(id: string) {
  await hydrateOfflineDb()
  const doc = getDocument()
  const tx = doc.transactions.find((item) => item.id === id)
  if (!tx) fail('Transaction not found')
  const account = doc.accounts.find((item) => item.id === tx.accountId)
  const running = account
    ? computeRunningBalancesForAccount(
        account.openingBalance,
        doc.transactions.filter((item) => item.accountId === tx.accountId)
      ).get(tx.id) ?? account.openingBalance
    : 0
  const item = toTransactionItem(tx, running)
  const reversal = doc.transactions.find((other) => other.isReversal && other.referenceId === tx.id)
  return {
    ...item,
    isReversed: !!reversal,
    reversalId: reversal?.id ?? null,
  }
}

export async function listBudgets(month: string) {
  await hydrateOfflineDb()
  const doc = getDocument()
  const spentByCategory = new Map<string, number>()
  for (const tx of doc.transactions) {
    if (!inMonth(tx.transactedAt, month) || !isEffectiveSpend(tx, doc.transactions)) continue
    spentByCategory.set(tx.categoryId, (spentByCategory.get(tx.categoryId) ?? 0) + tx.amount)
  }
  return doc.budgets
    .filter((budget) => budget.month === month)
    .map((budget) => {
      const category = budget.categoryId
        ? doc.categories.find((item) => item.id === budget.categoryId)
        : null
      const spent = budget.categoryId
        ? (spentByCategory.get(budget.categoryId) ?? 0)
        : Array.from(spentByCategory.values()).reduce((sum, value) => sum + value, 0)
      return {
        id: budget.id,
        familyId: null,
        categoryId: budget.categoryId,
        month: budget.month,
        monthlyLimit: budget.monthlyLimit,
        dailyLimit: budget.dailyLimit,
        weeklyLimit: budget.weeklyLimit,
        categoryName: category?.name ?? null,
        categoryIcon: category?.icon ?? null,
        spent,
        remaining: Math.max(0, budget.monthlyLimit - spent),
        percentUsed: budget.monthlyLimit > 0 ? Math.round((spent / budget.monthlyLimit) * 100) : 0,
      }
    })
    .sort((a, b) => {
      if (a.categoryId === null && b.categoryId !== null) return -1
      if (a.categoryId !== null && b.categoryId === null) return 1
      return (a.categoryName ?? '').localeCompare(b.categoryName ?? '')
    })
}

export interface ReportCategoryRow {
  categoryId: string
  name: string
  icon: string | null
  color: string | null
  amount: number
  percent: number
}

export interface ReportSummary {
  month: string
  income: number
  expense: number
  savings: number
  transactionCount: number
  expensesByCategory: ReportCategoryRow[]
  incomeByCategory: ReportCategoryRow[]
}

function categoryBreakdown(
  rows: LocalTransaction[],
  categories: LocalCategory[],
  total: number
): ReportCategoryRow[] {
  const totals = new Map<string, number>()
  for (const tx of rows) {
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount)
  }
  return [...totals.entries()]
    .map(([categoryId, amount]) => {
      const category = categories.find((item) => item.id === categoryId)
      return {
        categoryId,
        name: category?.name ?? 'Unknown',
        icon: category?.icon ?? null,
        color: category?.color ?? null,
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name))
}

export async function reportSummary(month: string): Promise<ReportSummary> {
  await hydrateOfflineDb()
  const doc = getDocument()
  const monthRows = doc.transactions.filter((tx) => inMonth(tx.transactedAt, month))
  const incomeRows = monthRows.filter((tx) => isEffectiveIncome(tx, doc.transactions))
  const expenseRows = monthRows.filter((tx) => isEffectiveSpend(tx, doc.transactions))
  const income = incomeRows.reduce((sum, tx) => sum + tx.amount, 0)
  const expense = expenseRows.reduce((sum, tx) => sum + tx.amount, 0)
  return {
    month,
    income,
    expense,
    savings: income - expense,
    transactionCount: monthRows.length,
    expensesByCategory: categoryBreakdown(expenseRows, doc.categories, expense),
    incomeByCategory: categoryBreakdown(incomeRows, doc.categories, income),
  }
}

export async function budgetSummary(month: string) {
  const items = await listBudgets(month)
  const overall = items.find((item) => item.categoryId === null)
  if (!overall) return { hasOverallBudget: false, month }
  const status =
    overall.percentUsed >= 100 ? 'exceeded' : overall.percentUsed >= 80 ? 'warning' : 'on_track'
  return {
    hasOverallBudget: true,
    month,
    monthlyLimit: overall.monthlyLimit,
    spent: overall.spent,
    percentUsed: overall.percentUsed,
    status: status as 'on_track' | 'warning' | 'exceeded',
  }
}

export async function saveBudget(input: {
  categoryId: string | null
  month: string
  monthlyLimit: number
  dailyLimit?: number
  weeklyLimit?: number
}) {
  const user = getLocalUser() ?? fail('Start the app first.')
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)) fail('Invalid month format. Use YYYY-MM')
  await mutateDocument((doc) => {
    const existing = doc.budgets.find(
      (budget) => budget.month === input.month && budget.categoryId === input.categoryId
    )
    if (existing) {
      existing.monthlyLimit = input.monthlyLimit
      existing.dailyLimit = input.dailyLimit ?? null
      existing.weeklyLimit = input.weeklyLimit ?? null
      return
    }
    doc.budgets.push({
      id: createId(),
      userId: user.id,
      familyId: null,
      categoryId: input.categoryId,
      month: input.month,
      monthlyLimit: input.monthlyLimit,
      dailyLimit: input.dailyLimit ?? null,
      weeklyLimit: input.weeklyLimit ?? null,
    })
  })
}

export async function deleteBudget(id: string) {
  await mutateDocument((doc) => {
    doc.budgets = doc.budgets.filter((budget) => budget.id !== id)
  })
}

export async function listUpcoming(month?: string) {
  await hydrateOfflineDb()
  const target = month ?? new Date().toISOString().slice(0, 7)
  const items = getDocument()
    .upcoming.map(refreshUpcomingStatus)
    .filter((item) => inMonth(item.dueDate, target))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const active = items.filter((item) => item.status === 'pending' || item.status === 'overdue')
  return {
    emis: active.filter((item) => item.type === 'emi').map(mapUpcoming),
    recurring: active.filter((item) => item.type === 'recurring').map(mapUpcoming),
    onetime: active.filter((item) => item.type === 'one_time').map(mapUpcoming),
    paid: items.filter((item) => item.status === 'paid').map(mapUpcoming),
    summary: {
      totalCommitted: active.reduce((sum, item) => sum + item.amount, 0),
      pendingCount: items.filter((item) => item.status === 'pending').length,
      overdueCount: items.filter((item) => item.status === 'overdue').length,
    },
  }
}

export async function upcomingHomeSummary(month?: string) {
  const data = await listUpcoming(month)
  const active = [...data.emis, ...data.recurring, ...data.onetime]
  return {
    topPayments: active.slice(0, 3),
    totalCount: active.length,
    totalCommitted: data.summary.totalCommitted,
    overdueCount: data.summary.overdueCount,
  }
}

export async function createUpcoming(input: {
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
}) {
  const user = getLocalUser() ?? fail('Start the app first.')
  let dueDate: Date
  if (input.type === 'one_time') {
    dueDate = new Date(input.dueDate ?? '')
    if (Number.isNaN(dueDate.getTime())) fail('Invalid due date')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (dueDate < today) fail('Due date must be today or in the future')
  } else {
    if (!input.recurrenceDay) fail('Recurrence day is required')
    dueDate = computeNextDueDate(input.recurrenceDay, new Date(Date.now() - 24 * 60 * 60 * 1000))
    if (dueDate < new Date()) dueDate = computeNextDueDate(input.recurrenceDay, new Date())
  }
  await mutateDocument((doc) => {
    doc.upcoming.push({
      id: createId(),
      userId: user.id,
      name: input.name.trim(),
      amount: input.amount,
      type: input.type,
      dueDate: dueDate.toISOString(),
      status: 'pending',
      accountId: input.accountId ?? null,
      categoryId: input.categoryId ?? null,
      recurrenceDay: input.recurrenceDay ?? null,
      emiTotalMonths: input.emiTotalMonths ?? null,
      emiPaidMonths: input.emiPaidMonths ?? 0,
      note: input.note ?? null,
    })
  })
}

function spawnNextCycle(doc: ReturnType<typeof getDocument>, payment: LocalUpcoming) {
  const day = payment.recurrenceDay ?? new Date(payment.dueDate).getDate()
  const nextDue = computeNextDueDate(day, new Date(payment.dueDate))
  const exists = doc.upcoming.some(
    (item) =>
      item.name === payment.name &&
      item.type === payment.type &&
      item.dueDate === nextDue.toISOString() &&
      (item.status === 'pending' || item.status === 'overdue')
  )
  if (exists) return
  if (payment.type === 'emi' && payment.emiTotalMonths && (payment.emiPaidMonths ?? 0) >= payment.emiTotalMonths) {
    return
  }
  doc.upcoming.push({
    ...payment,
    id: createId(),
    dueDate: nextDue.toISOString(),
    status: 'pending',
  })
}

export async function markUpcomingPaid(id: string, accountId?: string) {
  await mutateDocument((doc) => {
    const payment = doc.upcoming.find((item) => item.id === id)
    if (!payment) fail('Payment not found')
    if (payment.status === 'paid') fail('Already paid')
    const chosenAccountId = accountId ?? payment.accountId
    if (!chosenAccountId) fail('Select account before marking paid')
    const account = doc.accounts.find((item) => item.id === chosenAccountId && !item.isArchived)
    if (!account) fail('Account not found')
    payment.status = 'paid'
    payment.accountId = chosenAccountId
    if (payment.type === 'emi') payment.emiPaidMonths = (payment.emiPaidMonths ?? 0) + 1
    if (payment.type === 'recurring' || payment.type === 'emi') spawnNextCycle(doc, payment)
  })
}

export async function skipUpcoming(id: string) {
  await mutateDocument((doc) => {
    const payment = doc.upcoming.find((item) => item.id === id)
    if (!payment) fail('Payment not found')
    if (payment.type === 'one_time') fail('Cannot skip one-time payments')
    if (payment.status === 'paid') fail('Already paid')
    payment.status = 'paid'
    spawnNextCycle(doc, payment)
  })
}

export async function deleteUpcoming(id: string) {
  await mutateDocument((doc) => {
    const exists = doc.upcoming.some((item) => item.id === id)
    if (!exists) fail('Payment not found')
    doc.upcoming = doc.upcoming.filter((item) => item.id !== id)
  })
}

