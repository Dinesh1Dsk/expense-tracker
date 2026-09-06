import { useEffect, useMemo, useState } from 'react'
import {
  Animated,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useTransactionsStore } from '../../stores/transactions.store'
import type { TransactionCategory } from '../../stores/transactions.store'
import { premiumTheme } from '../../theme/premium'
import { formatINR, toPaise } from '../../utils/money'
import DateTimePicker from '@react-native-community/datetimepicker'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Swipeable } from 'react-native-gesture-handler'

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ quickAdd?: string }>()
  const {
    items,
    meta,
    summary,
    filters,
    hasMore,
    error,
    isLoading,
    fetchMeta,
    fetchTransactions,
    setFilter,
    clearFilters,
    loadMore,
    createTransaction,
    reverseTransaction,
    fetchRecentCategories,
  } = useTransactionsStore()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [recentCategories, setRecentCategories] = useState<TransactionCategory[]>([])
  const [searchText, setSearchText] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false)
  const [isCategoryFilterPickerOpen, setIsCategoryFilterPickerOpen] = useState(false)
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false)
  const addSheetTranslateY = useMemo(() => new Animated.Value(0), [])
  const [showFiltersAndSummary, setShowFiltersAndSummary] = useState(true)

  useEffect(() => {
    fetchMeta()
    fetchTransactions(true)
  }, [fetchMeta, fetchTransactions])

  useEffect(() => {
    if (!meta?.accounts.length) return
    setSelectedAccountId((prev) => prev ?? meta.accounts[0].id)
  }, [meta?.accounts])

  useEffect(() => {
    if (!meta?.categories.length) return
    setSelectedCategoryId((prev) => prev ?? meta.categories[0].id)
  }, [meta?.categories])

  useEffect(() => {
    if (!isPickerOpen) return
    fetchRecentCategories().then(setRecentCategories).catch(() => setRecentCategories([]))
  }, [isPickerOpen, fetchRecentCategories])
  useEffect(() => {
    if (params.quickAdd === '1') setIsAddOpen(true)
  }, [params.quickAdd])
  useEffect(() => {
    if (isAddOpen) addSheetTranslateY.setValue(0)
  }, [isAddOpen, addSheetTranslateY])
  useEffect(() => {
    const t = setTimeout(() => {
      void setFilter('search', searchText || null)
    }, 300)
    return () => clearTimeout(t)
  }, [searchText, setFilter])

  const selectedAccount = useMemo(
    () => meta?.accounts.find((item) => item.id === selectedAccountId),
    [meta?.accounts, selectedAccountId]
  )
  const selectedCategory = useMemo(
    () => meta?.categories.find((item) => item.id === selectedCategoryId),
    [meta?.categories, selectedCategoryId]
  )
  const parentCategories = useMemo(
    () => (meta?.categories ?? []).filter((item) => !item.isSubcategory),
    [meta?.categories]
  )
  const selectedParent = useMemo(
    () => parentCategories.find((item) => item.id === selectedCategoryId),
    [parentCategories, selectedCategoryId]
  )
  const childCategories = useMemo(() => {
    if (!selectedParent) return []
    return (meta?.categories ?? []).filter(
      (item) => item.isSubcategory && item.parentName === selectedParent.name
    )
  }, [meta?.categories, selectedParent])
  const pickerList = useMemo(() => {
    const list = meta?.categories ?? []
    if (pickerSearch.trim().length < 1) return list
    const q = pickerSearch.trim().toLowerCase()
    return list.filter((item) => item.name.toLowerCase().includes(q) || item.fullName.toLowerCase().includes(q))
  }, [meta?.categories, pickerSearch])

  const submit = async () => {
    if (!selectedAccount || !selectedCategory) return
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) return

    setIsSubmitting(true)
    try {
      await createTransaction({
        accountId: selectedAccount.id,
        categoryId: selectedCategory.id,
        amount: toPaise(parsed),
        type,
        note: note.trim() || undefined,
        transactedAt: selectedDate.toISOString(),
      })
      setAmount('')
      setNote('')
      setIsAddOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const groupedRows = useMemo(() => {
    const groups = new Map<string, { label: string; items: typeof items }>()
    const now = new Date()
    const today = now.toDateString()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString()
    for (const item of items) {
      const d = new Date(item.transactedAt)
      const key = d.toISOString().slice(0, 10)
      if (!groups.has(key)) {
        const label =
          d.toDateString() === today
            ? `TODAY — ${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
            : d.toDateString() === yesterday
              ? `YESTERDAY — ${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
              : d
                  .toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                  .toUpperCase()
        groups.set(key, { label, items: [] })
      }
      groups.get(key)!.items.push(item)
    }
    const output: Array<{ kind: 'header' | 'row'; id: string; label?: string; item?: (typeof items)[number] }> = []
    for (const [key, value] of groups.entries()) {
      output.push({ kind: 'header', id: `h-${key}`, label: value.label })
      for (const item of value.items) output.push({ kind: 'row', id: item.id, item })
    }
    return output
  }, [items])
  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 18 }).map((_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - idx, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      return { value, label }
    })
  }, [])
  const getDisplayNote = (note: string | null) => {
    if (!note?.trim()) return 'No note'
    if (/^reversal of\s+/i.test(note.trim())) return 'Reversal entry'
    return note
  }
  const formatTxnDateTime = (value: string) =>
    new Date(value).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
  const addSheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          const nextY = Math.max(0, gesture.dy)
          addSheetTranslateY.setValue(nextY)
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 120 || gesture.vy > 1.2) {
            Animated.timing(addSheetTranslateY, {
              toValue: 700,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              setIsAddOpen(false)
              addSheetTranslateY.setValue(0)
            })
            return
          }
          Animated.spring(addSheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start()
        },
      }),
    [addSheetTranslateY]
  )

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 24) }]}>
      <Text style={styles.eyebrow}>LEDGER</Text>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Transactions</Text>
        <Pressable style={styles.collapseBtn} onPress={() => setShowFiltersAndSummary((v) => !v)}>
          <Text style={styles.collapseBtnText}>{showFiltersAndSummary ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, styles.searchInput]}
          placeholder="Search note or amount"
          placeholderTextColor={premiumTheme.colors.textSoft}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      {showFiltersAndSummary ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
          >
            <Pressable style={styles.selectorChip} onPress={() => setIsMonthPickerOpen(true)}>
              <Text style={styles.selectorChipText}>{filters.month}</Text>
            </Pressable>
            <Pressable
              style={[styles.selectorChip, filters.accountId && styles.selectorChipActive]}
              onPress={() => setIsAccountPickerOpen(true)}
            >
              <Text style={[styles.selectorChipText, filters.accountId && styles.selectorChipTextActive]}>
                {filters.accountId
                  ? meta?.accounts.find((a) => a.id === filters.accountId)?.name ?? 'Account Filtered'
                  : 'All accounts'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.selectorChip, filters.categoryId && styles.selectorChipActive]}
              onPress={() => setIsCategoryFilterPickerOpen(true)}
            >
              <Text style={[styles.selectorChipText, filters.categoryId && styles.selectorChipTextActive]}>
                {filters.categoryId
                  ? meta?.categories.find((c) => c.id === filters.categoryId)?.name ?? 'Category Filtered'
                  : 'All categories'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.selectorChip, filters.type && styles.selectorChipActive]}
              onPress={() => setIsTypePickerOpen(true)}
            >
              <Text style={[styles.selectorChipText, filters.type && styles.selectorChipTextActive]}>
                {filters.type ? filters.type : 'All types'}
              </Text>
            </Pressable>
          </ScrollView>

          <View style={styles.summaryBar}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryText}>{formatINR(summary.totalIncome)}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Expense</Text>
              <Text style={styles.summaryText}>{formatINR(summary.totalExpense)}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Savings</Text>
              <Text style={styles.summaryText}>{formatINR(summary.savings)}</Text>
            </View>
          </View>
        </>
      ) : null}

      <Modal visible={isAddOpen} transparent animationType="slide" onRequestClose={() => setIsAddOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: addSheetTranslateY }] }]}
            {...addSheetPanResponder.panHandlers}
          >
            <View style={styles.dragHandleWrap}>
              <View style={styles.dragHandle} />
            </View>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add Transaction</Text>
              <Pressable onPress={() => setIsAddOpen(false)}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            <ScrollView>
              <View style={styles.formCard}>
        <Text style={styles.formTitle}>Add transaction</Text>
        <Text style={styles.metaText}>
          Account: {selectedAccount?.name ?? 'No account'} | Category:{' '}
          {selectedCategory?.name ?? 'No category'}
        </Text>
        <View style={styles.selectorBlock}>
          <Text style={styles.selectorTitle}>Account</Text>
          <FlatList
            data={meta?.accounts ?? []}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.selectorList}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.selectorChip,
                  selectedAccountId === item.id && styles.selectorChipActive,
                ]}
                onPress={() => setSelectedAccountId(item.id)}
              >
                <Text
                  style={[
                    styles.selectorChipText,
                    selectedAccountId === item.id && styles.selectorChipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </View>
        <View style={styles.selectorBlock}>
          <Text style={styles.selectorTitle}>Category</Text>
          <Pressable style={styles.pickerBtn} onPress={() => setIsPickerOpen(true)}>
            <Text style={styles.pickerBtnText}>
              {selectedCategory ? `${selectedCategory.icon ?? ''} ${selectedCategory.fullName}` : 'Select Category'}
            </Text>
          </Pressable>
          <Pressable style={styles.manageLink} onPress={() => router.push('/categories')}>
            <Text style={styles.manageLinkText}>Manage categories</Text>
          </Pressable>
        </View>
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typePill, type === 'DEBIT' && styles.typePillActive]}
            onPress={() => setType('DEBIT')}
          >
            <Text style={[styles.typeText, type === 'DEBIT' && styles.typeTextActive]}>Debit</Text>
          </Pressable>
          <Pressable
            style={[styles.typePill, type === 'CREDIT' && styles.typePillActive]}
            onPress={() => setType('CREDIT')}
          >
            <Text style={[styles.typeText, type === 'CREDIT' && styles.typeTextActive]}>Credit</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Amount in rupees"
          placeholderTextColor={premiumTheme.colors.textSoft}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor={premiumTheme.colors.textSoft}
          value={note}
          onChangeText={setNote}
        />
        <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateBtnText}>
            Date: {selectedDate.toLocaleDateString('en-IN')}
          </Text>
        </Pressable>
        {showDatePicker ? (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowDatePicker(false)
              if (date) setSelectedDate(date)
            }}
          />
        ) : null}
        <Pressable
          style={[styles.btn, (isSubmitting || !selectedAccount || !selectedCategory) && styles.btnDisabled]}
          disabled={isSubmitting || !selectedAccount || !selectedCategory}
          onPress={submit}
        >
          <Text style={styles.btnText}>
            {isSubmitting ? 'Saving...' : 'Save transaction'}
          </Text>
        </Pressable>
      </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {isLoading ? <Text style={styles.metaText}>Loading transactions...</Text> : null}

      <FlatList
        data={groupedRows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 180, 210) }]}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <Text style={styles.groupHeader}>{item.label}</Text>
          ) : (
            Platform.OS === 'ios' ? (
              <Swipeable
                overshootRight={false}
                renderRightActions={() =>
                  item.item!.isReversal ? null : (
                    <Pressable style={styles.swipeReverse} onPress={() => reverseTransaction(item.item!.id)}>
                      <Text style={styles.swipeReverseText}>Reverse</Text>
                    </Pressable>
                  )
                }
              >
                <Pressable
                  style={[styles.row, item.item!.isReversal && styles.reversalRow]}
                  onPress={() => router.push(`/transactions/${item.item!.id}`)}
                >
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.item!.category.icon ?? '📦'} {item.item!.category.name}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {item.item!.account.name} · {formatTxnDateTime(item.item!.transactedAt)}
                    </Text>
                    <Text style={styles.noteText} numberOfLines={2}>
                      {getDisplayNote(item.item!.note)} · Bal: {formatINR(item.item!.runningBalance)}
                    </Text>
                    {item.item!.isReversal ? <Text style={styles.reversalBadge}>Reversal</Text> : null}
                  </View>
                  <Text
                    style={[
                      styles.amountText,
                      item.item!.type === 'DEBIT' ? styles.amountDebit : styles.amountCredit,
                    ]}
                  >
                    {item.item!.type === 'DEBIT' ? '-' : '+'}
                    {formatINR(item.item!.amount)}
                  </Text>
                </Pressable>
              </Swipeable>
            ) : (
              <Pressable
                style={[styles.row, item.item!.isReversal && styles.reversalRow]}
                onPress={() => router.push(`/transactions/${item.item!.id}`)}
              >
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.item!.category.icon ?? '📦'} {item.item!.category.name}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {item.item!.account.name} · {formatTxnDateTime(item.item!.transactedAt)}
                  </Text>
                  <Text style={styles.noteText} numberOfLines={2}>
                    {getDisplayNote(item.item!.note)} · Bal: {formatINR(item.item!.runningBalance)}
                  </Text>
                  {item.item!.isReversal ? <Text style={styles.reversalBadge}>Reversal</Text> : null}
                </View>
                <View style={styles.rowRightRail}>
                  <Text
                    style={[
                      styles.amountText,
                      item.item!.type === 'DEBIT' ? styles.amountDebit : styles.amountCredit,
                    ]}
                    numberOfLines={1}
                  >
                    {item.item!.type === 'DEBIT' ? '-' : '+'}
                    {formatINR(item.item!.amount)}
                  </Text>
                </View>
              </Pressable>
            )
          )
        }
        ListFooterComponent={
          <>
            {hasMore ? <Text style={styles.metaText}>Loading more...</Text> : null}
            {(filters.accountId || filters.categoryId || filters.search) && (
              <Pressable style={styles.manageLink} onPress={() => clearFilters()}>
                <Text style={styles.manageLinkText}>Clear all filters</Text>
              </Pressable>
            )}
            {!isLoading && items.length === 0 && !filters.search && !filters.accountId && !filters.categoryId ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptyText}>Tap + to record your first expense or income.</Text>
                <Pressable style={styles.btn} onPress={() => setIsAddOpen(true)}>
                  <Text style={styles.btnText}>Add Transaction</Text>
                </Pressable>
              </View>
            ) : null}
            {!isLoading && items.length === 0 && (filters.search || filters.accountId || filters.categoryId) ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No transactions found</Text>
                <Text style={styles.emptyText}>Try a different filter or search term.</Text>
                <Pressable style={styles.manageLink} onPress={() => clearFilters()}>
                  <Text style={styles.manageLinkText}>Clear all filters</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        }
      />
      <Animated.View
        style={[
          styles.createFabWrap,
          { bottom: Math.max(insets.bottom + 72, 88) },
        ]}
      >
        <Pressable style={styles.createFab} onPress={() => setIsAddOpen(true)}>
          <Text style={styles.createFabText}>+</Text>
        </Pressable>
      </Animated.View>
      <Modal
        visible={isMonthPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMonthPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { height: '55%' }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Month</Text>
              <Pressable onPress={() => setIsMonthPickerOpen(false)}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            <FlatList
              data={months}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.sheetRow, filters.month === item.value && styles.selectorChipActive]}
                  onPress={async () => {
                    await setFilter('month', item.value)
                    setIsMonthPickerOpen(false)
                  }}
                >
                  <Text
                    style={[
                      styles.sheetRowText,
                      filters.month === item.value && styles.selectorChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
      <Modal
        visible={isAccountPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAccountPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { height: '55%' }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Account</Text>
              <Pressable onPress={() => setIsAccountPickerOpen(false)}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.sheetRow, !filters.accountId && styles.selectorChipActive]}
              onPress={async () => {
                await setFilter('accountId', null)
                setIsAccountPickerOpen(false)
              }}
            >
              <Text style={[styles.sheetRowText, !filters.accountId && styles.selectorChipTextActive]}>
                All accounts
              </Text>
            </Pressable>
            <FlatList
              data={meta?.accounts ?? []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.sheetRow, filters.accountId === item.id && styles.selectorChipActive]}
                  onPress={async () => {
                    await setFilter('accountId', item.id)
                    setIsAccountPickerOpen(false)
                  }}
                >
                  <Text
                    style={[
                      styles.sheetRowText,
                      filters.accountId === item.id && styles.selectorChipTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
      <Modal
        visible={isCategoryFilterPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoryFilterPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { height: '60%' }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Category</Text>
              <Pressable onPress={() => setIsCategoryFilterPickerOpen(false)}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.sheetRow, !filters.categoryId && styles.selectorChipActive]}
              onPress={async () => {
                await setFilter('categoryId', null)
                setIsCategoryFilterPickerOpen(false)
              }}
            >
              <Text style={[styles.sheetRowText, !filters.categoryId && styles.selectorChipTextActive]}>
                All categories
              </Text>
            </Pressable>
            <FlatList
              data={meta?.categories ?? []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.sheetRow, filters.categoryId === item.id && styles.selectorChipActive]}
                  onPress={async () => {
                    await setFilter('categoryId', item.id)
                    setIsCategoryFilterPickerOpen(false)
                  }}
                >
                  <Text
                    style={[
                      styles.sheetRowText,
                      filters.categoryId === item.id && styles.selectorChipTextActive,
                    ]}
                  >
                    {item.icon ?? '📦'} {item.fullName}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
      <Modal
        visible={isTypePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTypePickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { height: '35%' }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Type</Text>
              <Pressable onPress={() => setIsTypePickerOpen(false)}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            {[
              { label: 'All types', value: null },
              { label: 'DEBIT', value: 'DEBIT' },
              { label: 'CREDIT', value: 'CREDIT' },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={[styles.sheetRow, filters.type === item.value && styles.selectorChipActive]}
                onPress={async () => {
                  await setFilter('type', item.value)
                  setIsTypePickerOpen(false)
                }}
              >
                <Text
                  style={[
                    styles.sheetRowText,
                    filters.type === item.value && styles.selectorChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
      <Modal visible={isPickerOpen} transparent animationType="slide" onRequestClose={() => setIsPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Category</Text>
              <Pressable onPress={() => setIsPickerOpen(false)}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Search categories..."
              placeholderTextColor={premiumTheme.colors.textSoft}
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoFocus
            />
            {pickerSearch.trim().length === 0 && recentCategories.length > 0 ? (
              <View style={styles.selectorBlock}>
                <Text style={styles.selectorTitle}>Recent</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorList}>
                  {recentCategories.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.recentChip}
                      onPress={() => {
                        setSelectedCategoryId(item.id)
                        setIsPickerOpen(false)
                      }}
                    >
                      <Text style={styles.recentChipText}>{item.icon ?? '📦'} {item.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
            <FlatList
              data={pickerList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.sheetRow}
                  onPress={() => {
                    setSelectedCategoryId(item.id)
                    setIsPickerOpen(false)
                  }}
                >
                  <Text style={styles.sheetRowText}>{item.icon ?? '📦'} {item.fullName}</Text>
                </Pressable>
              )}
              ListFooterComponent={
                <Pressable
                  style={styles.noneRow}
                  onPress={() => {
                    setSelectedCategoryId(null)
                    setIsPickerOpen(false)
                  }}
                >
                  <Text style={styles.noneText}>None / Uncategorized</Text>
                </Pressable>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premiumTheme.colors.bg,
    paddingHorizontal: 20,
  },
  eyebrow: {
    color: premiumTheme.colors.textSoft,
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    color: premiumTheme.colors.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collapseBtn: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0A0A0B',
  },
  collapseBtnText: { color: premiumTheme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchInput: { flex: 1, marginBottom: 0 },
  formCard: {
    backgroundColor: premiumTheme.colors.surface,
    borderColor: premiumTheme.colors.border,
    borderWidth: 1,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  formTitle: { color: premiumTheme.colors.text, fontWeight: '600', marginBottom: 8 },
  metaText: { color: premiumTheme.colors.textMuted, marginBottom: 10 },
  selectorBlock: { marginBottom: 10 },
  selectorTitle: { color: premiumTheme.colors.textMuted, marginBottom: 6, fontSize: 12 },
  selectorList: { gap: 8 },
  filterScroll: { marginTop: 8, marginBottom: 10, minHeight: 44 },
  filterScrollContent: { gap: 8, alignItems: 'center', paddingVertical: 2 },
  selectorChip: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0A0A0B',
  },
  selectorChipActive: { backgroundColor: premiumTheme.colors.text },
  selectorChipText: { color: premiumTheme.colors.text, fontSize: 12, fontWeight: '600' },
  selectorChipTextActive: { color: premiumTheme.colors.accentText },
  pickerBtn: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    padding: 12,
    backgroundColor: '#0A0A0B',
  },
  pickerBtnText: { color: premiumTheme.colors.text },
  manageLink: { marginTop: 6, alignSelf: 'flex-start' },
  manageLinkText: { color: '#1D9E75', fontWeight: '600', fontSize: 12 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typePill: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typePillActive: { backgroundColor: premiumTheme.colors.text },
  typeText: { color: premiumTheme.colors.textMuted, fontWeight: '600' },
  typeTextActive: { color: premiumTheme.colors.accentText },
  input: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    padding: 12,
    color: premiumTheme.colors.text,
    backgroundColor: '#0A0A0B',
    marginBottom: 10,
  },
  btn: {
    backgroundColor: premiumTheme.colors.accent,
    borderRadius: premiumTheme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#0A0A0B',
  },
  dateBtnText: { color: premiumTheme.colors.text },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
  errorText: { color: '#FF6666', marginBottom: 8 },
  list: { paddingBottom: 24, gap: 10 },
  groupHeader: { color: premiumTheme.colors.textSoft, fontSize: 11, fontWeight: '700', marginTop: 8 },
  row: {
    backgroundColor: premiumTheme.colors.surface,
    borderColor: premiumTheme.colors.border,
    borderWidth: 1,
    borderRadius: premiumTheme.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    paddingRight: 10,
    minWidth: 0,
  },
  reversalRow: {
    opacity: 0.6,
  },
  summaryBar: {
    backgroundColor: '#173328',
    borderWidth: 1,
    borderColor: '#1D9E75',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  summaryCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#76D9B6',
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
  },
  summaryText: { color: '#76D9B6', fontSize: 13, fontWeight: '700' },
  amountText: { color: premiumTheme.colors.text, fontWeight: '700', fontSize: 16, textAlign: 'right' },
  amountCredit: { color: '#1D9E75' },
  amountDebit: { color: '#E24B4A' },
  rowTitle: { color: premiumTheme.colors.text, fontWeight: '700', marginBottom: 1 },
  rowMeta: { color: premiumTheme.colors.textSoft, marginTop: 2, fontSize: 12 },
  noteText: { color: premiumTheme.colors.textMuted, marginTop: 3, fontSize: 13, lineHeight: 18 },
  rowRightRail: {
    width: 84,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  reversalBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#3D1A1A',
    color: '#FF7B7B',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '700',
  },
  swipeReverse: {
    backgroundColor: '#B91C1C',
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    borderRadius: 10,
    marginLeft: 8,
  },
  swipeReverseText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  createFabWrap: {
    position: 'absolute',
    right: 20,
  },
  createFab: {
    backgroundColor: premiumTheme.colors.accent,
    borderRadius: 9999,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
  },
  createFabText: { color: premiumTheme.colors.accentText, fontWeight: '700', fontSize: 28, lineHeight: 28 },
  emptyState: {
    backgroundColor: premiumTheme.colors.surface,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    gap: 8,
  },
  emptyTitle: { color: premiumTheme.colors.text, fontWeight: '700', fontSize: 16 },
  emptyText: { color: premiumTheme.colors.textMuted },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    height: '75%',
    backgroundColor: premiumTheme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 14,
  },
  dragHandleWrap: { alignItems: 'center', paddingBottom: 8 },
  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: premiumTheme.colors.textSoft,
    opacity: 0.7,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { color: premiumTheme.colors.text, fontWeight: '700', fontSize: 18 },
  close: { color: premiumTheme.colors.textMuted, fontSize: 18, fontWeight: '700' },
  recentChip: { borderWidth: 1, borderColor: '#1D9E75', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#173328' },
  recentChipText: { color: '#76D9B6', fontSize: 12, fontWeight: '600' },
  sheetRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: premiumTheme.colors.border },
  sheetRowText: { color: premiumTheme.colors.text },
  noneRow: { paddingVertical: 14 },
  noneText: { color: premiumTheme.colors.textMuted, fontStyle: 'italic' },
})
