import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ReportCategoryRow } from '../../offline/repo'
import { useReportsStore } from '../../stores/reports.store'
import { premiumTheme } from '../../theme/premium'
import { formatINR } from '../../utils/money'

function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split('-').map(Number)
  const next = new Date(year, monthIndex - 1 + delta, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number)
  if (!year || !monthIndex) return month
  return new Date(year, monthIndex - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets()
  const { month, summary, isLoading, error, setMonth, fetchReport } = useReportsStore()
  const [monthDraft, setMonthDraft] = useState(month)

  useEffect(() => {
    setMonthDraft(month)
  }, [month])

  useEffect(() => {
    void fetchReport()
  }, [month, fetchReport])

  useFocusEffect(
    useCallback(() => {
      void fetchReport()
    }, [fetchReport])
  )

  const applyMonth = (value: string) => {
    const next = value.trim()
    setMonthDraft(next)
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(next) && next !== month) {
      setMonth(next)
    }
  }

  const empty = !!summary && summary.transactionCount === 0
  const savingsNegative = (summary?.savings ?? 0) < 0

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 24) }]}>
      <Text style={styles.eyebrow}>INSIGHTS</Text>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.subtitle}>Personal monthly totals from your on-device ledger.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Month</Text>
        <View style={styles.monthRow}>
          <Pressable style={styles.monthStep} onPress={() => applyMonth(shiftMonth(month, -1))}>
            <Text style={styles.monthStepText}>‹</Text>
          </Pressable>
          <TextInput
            style={styles.monthInput}
            value={monthDraft}
            onChangeText={applyMonth}
            placeholder="YYYY-MM"
            placeholderTextColor={premiumTheme.colors.textSoft}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.monthStep} onPress={() => applyMonth(shiftMonth(month, 1))}>
            <Text style={styles.monthStepText}>›</Text>
          </Pressable>
        </View>
        <Text style={styles.metaText}>{monthLabel(month)}</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {isLoading && !summary ? <Text style={styles.metaText}>Loading report...</Text> : null}

      {empty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No transactions this month</Text>
          <Text style={styles.emptyText}>Add income or expenses to see your monthly report.</Text>
        </View>
      ) : summary ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>{formatINR(summary.income)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Expense</Text>
              <Text style={styles.summaryValue}>{formatINR(summary.expense)}</Text>
            </View>
            <View style={styles.summaryCardWide}>
              <Text style={styles.summaryLabel}>Savings</Text>
              <Text style={[styles.summaryValue, savingsNegative && styles.summaryNegative]}>
                {formatINR(summary.savings)}
              </Text>
              <Text style={styles.metaText}>Income minus effective spend</Text>
            </View>
          </View>

          <CategorySection title="Expense by category" rows={summary.expensesByCategory} emptyHint="No spend counted this month." />
          <CategorySection title="Income by category" rows={summary.incomeByCategory} emptyHint="No income counted this month." />
        </ScrollView>
      ) : null}
    </View>
  )
}

function CategorySection({
  title,
  rows,
  emptyHint,
}: {
  title: string
  rows: ReportCategoryRow[]
  emptyHint: string
}) {
  const maxAmount = useMemo(() => rows.reduce((max, row) => Math.max(max, row.amount), 0), [rows])

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={styles.metaText}>{emptyHint}</Text>
      ) : (
        rows.map((row) => {
          const barWidth = maxAmount > 0 ? Math.max(6, Math.round((row.amount / maxAmount) * 100)) : 0
          return (
            <View key={row.categoryId} style={styles.categoryRow}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {row.icon ? `${row.icon} ` : ''}
                  {row.name}
                </Text>
                <Text style={styles.categoryAmount}>{formatINR(row.amount)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${barWidth}%`, backgroundColor: row.color || premiumTheme.colors.text },
                  ]}
                />
              </View>
              <Text style={styles.categoryPercent}>{row.percent}% of total</Text>
            </View>
          )
        })
      )}
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
  subtitle: { color: premiumTheme.colors.textMuted, marginBottom: 16 },
  card: {
    backgroundColor: premiumTheme.colors.surface,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { color: premiumTheme.colors.text, fontWeight: '600', marginBottom: 10 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  monthStep: {
    width: 40,
    height: 44,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    backgroundColor: '#0A0A0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthStepText: { color: premiumTheme.colors.text, fontSize: 22, fontWeight: '600' },
  monthInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: premiumTheme.colors.text,
    backgroundColor: '#0A0A0B',
    textAlign: 'center',
    fontWeight: '600',
  },
  list: { paddingBottom: 32, gap: 12 },
  summaryGrid: { gap: 10 },
  summaryCard: {
    backgroundColor: premiumTheme.colors.surface,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
  },
  summaryCardWide: {
    backgroundColor: premiumTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
  },
  summaryLabel: {
    color: premiumTheme.colors.textMuted,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: { color: premiumTheme.colors.text, fontSize: 22, fontWeight: '700' },
  summaryNegative: { color: '#FF7B7B' },
  section: {
    backgroundColor: premiumTheme.colors.surface,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    gap: 12,
  },
  sectionTitle: { color: premiumTheme.colors.text, fontWeight: '700', fontSize: 14 },
  categoryRow: { gap: 6 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  categoryName: { color: premiumTheme.colors.text, fontWeight: '600', flex: 1 },
  categoryAmount: { color: premiumTheme.colors.text, fontWeight: '700' },
  barTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#0A0A0B',
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 999,
  },
  categoryPercent: { color: premiumTheme.colors.textSoft, fontSize: 11, fontWeight: '600' },
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
  metaText: { color: premiumTheme.colors.textMuted },
  errorText: { color: '#FF6666', marginBottom: 8 },
})
