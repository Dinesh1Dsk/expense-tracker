import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { premiumTheme } from '../../theme/premium'
import { useAccountStore } from '../../stores/account.store'
import { useUpcomingStore } from '../../stores/upcoming.store'
import { formatINR } from '../../utils/money'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { accounts, isLoading, error, fetchAccounts } = useAccountStore()
  const { homeSummary, fetchHomeSummary } = useUpcomingStore()
  const [showAccounts, setShowAccounts] = useState(false)

  useEffect(() => {
    fetchAccounts()
    fetchHomeSummary()
  }, [fetchAccounts, fetchHomeSummary])
  useFocusEffect(
    useCallback(() => {
      void fetchAccounts()
      void fetchHomeSummary()
    }, [fetchAccounts, fetchHomeSummary])
  )

  const totalAvailable = useMemo(
    () => accounts.reduce((sum, account) => sum + account.availableBalance, 0),
    [accounts]
  )
  const getUpcomingStatus = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    if (dueStart.getTime() < todayStart.getTime()) return 'overdue' as const
    if (dueStart.getTime() === todayStart.getTime()) return 'today' as const
    return 'pending' as const
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 24) }]}>
      <Text style={styles.eyebrow}>OVERVIEW</Text>
      <Text style={styles.title}>Accounts</Text>
      <View style={styles.quickActionsWrap}>
        <Text style={styles.quickActionsLabel}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <Pressable style={[styles.quickActionBtn, styles.quickActionPrimary]} onPress={() => router.push('/transactions?quickAdd=1')}>
            <Text style={[styles.quickActionText, styles.quickActionPrimaryText]}>+ Add Transaction</Text>
          </Pressable>
          <Pressable style={styles.quickActionBtn} onPress={() => router.push('/accounts')}>
            <Text style={styles.quickActionText}>Manage Accounts</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.summaryCard} onPress={() => setShowAccounts((prev) => !prev)}>
        <Text style={styles.summaryLabel}>Available Balance</Text>
        <Text style={styles.summaryValue}>{formatINR(totalAvailable)}</Text>
        <Text style={styles.summaryHint}>{showAccounts ? 'Hide account list' : 'View account list'}</Text>
      </Pressable>
      {homeSummary && homeSummary.totalCount > 0 ? (
        <View style={styles.upcomingCard}>
          <View style={styles.upcomingHeader}>
            <Text style={styles.upcomingTitle}>Upcoming this month</Text>
            <Pressable onPress={() => router.push('/upcoming')}>
              <Text style={styles.upcomingLink}>View all</Text>
            </Pressable>
          </View>
          {homeSummary.topPayments.map((item) => (
            <View style={styles.upcomingRow} key={item.id}>
              <View style={styles.upcomingLeft}>
                <Text style={styles.upcomingName} numberOfLines={1}>
                  {item.name}
                </Text>
                {getUpcomingStatus(item.dueDate) !== 'pending' ? (
                  <View
                    style={[
                      styles.upcomingBadge,
                      getUpcomingStatus(item.dueDate) === 'overdue'
                        ? styles.upcomingBadgeOverdue
                        : styles.upcomingBadgeToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.upcomingBadgeText,
                        getUpcomingStatus(item.dueDate) === 'overdue'
                          ? styles.upcomingBadgeOverdueText
                          : styles.upcomingBadgeTodayText,
                      ]}
                    >
                      {getUpcomingStatus(item.dueDate) === 'overdue' ? 'Overdue' : 'Today'}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.upcomingAmount,
                  getUpcomingStatus(item.dueDate) === 'overdue'
                    ? styles.upcomingAmountOverdue
                    : getUpcomingStatus(item.dueDate) === 'today'
                      ? styles.upcomingAmountToday
                      : null,
                ]}
              >
                {formatINR(item.amount)}
              </Text>
            </View>
          ))}
          <Text style={styles.upcomingTotal}>Total committed: {formatINR(homeSummary.totalCommitted)}</Text>
          <Text style={styles.upcomingNote}>For your awareness — not deducted from balance</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {isLoading ? <Text style={styles.helpText}>Loading accounts...</Text> : null}

      {showAccounts ? (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.accountCard}>
              <View>
                <Text style={styles.accountName}>{item.name}</Text>
              </View>
              <Pressable onPress={() => router.push(`/accounts/${item.id}`)} style={styles.balanceTapArea}>
                <Text style={styles.balanceLabel}>Available</Text>
                <Text style={styles.balanceValue}>{formatINR(item.availableBalance)}</Text>
              </Pressable>
            </View>
          )}
        />
      ) : null}
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
    marginBottom: 16,
  },
  quickActionsWrap: {
    marginBottom: 14,
  },
  quickActionsLabel: {
    color: premiumTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: premiumTheme.colors.surface,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionPrimary: {
    backgroundColor: premiumTheme.colors.text,
  },
  quickActionText: {
    color: premiumTheme.colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  quickActionPrimaryText: {
    color: premiumTheme.colors.accentText,
  },
  summaryCard: {
    backgroundColor: premiumTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 16,
    marginBottom: 14,
  },
  summaryLabel: {
    color: premiumTheme.colors.textMuted,
    marginBottom: 6,
  },
  summaryValue: {
    color: premiumTheme.colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  summaryHint: {
    color: premiumTheme.colors.textMuted,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  upcomingCard: {
    backgroundColor: premiumTheme.colors.surface,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  upcomingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  upcomingTitle: { color: premiumTheme.colors.text, fontWeight: '700', fontSize: 14 },
  upcomingLink: { color: premiumTheme.colors.textMuted, fontWeight: '600', fontSize: 12 },
  upcomingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  upcomingLeft: { flex: 1, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  upcomingName: { color: premiumTheme.colors.textMuted, fontSize: 12, flexShrink: 1 },
  upcomingAmount: { color: premiumTheme.colors.text, fontWeight: '700', fontSize: 12 },
  upcomingAmountOverdue: { color: '#E24B4A' },
  upcomingAmountToday: { color: '#BA7517' },
  upcomingBadge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  upcomingBadgeText: { fontSize: 10, fontWeight: '700' },
  upcomingBadgeOverdue: { backgroundColor: '#FEF2F2' },
  upcomingBadgeOverdueText: { color: '#DC2626' },
  upcomingBadgeToday: { backgroundColor: '#FEF3F2' },
  upcomingBadgeTodayText: { color: '#991B1B' },
  upcomingTotal: { color: '#BA7517', fontWeight: '700', marginTop: 4, fontSize: 12 },
  upcomingNote: { color: premiumTheme.colors.textSoft, marginTop: 2, fontSize: 11 },
  errorText: {
    color: '#FF6767',
    marginBottom: 8,
  },
  helpText: {
    color: premiumTheme.colors.textMuted,
    marginBottom: 8,
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  accountCard: {
    backgroundColor: premiumTheme.colors.surface,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountName: {
    color: premiumTheme.colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  balanceLabel: {
    color: premiumTheme.colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  balanceTapArea: {
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  balanceValue: {
    color: premiumTheme.colors.text,
    fontWeight: '700',
    marginTop: 4,
  },
})
