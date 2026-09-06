import { useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useBudgetStore } from '../../stores/budget.store'
import { premiumTheme } from '../../theme/premium'
import { formatINR, toPaise } from '../../utils/money'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function BudgetScreen() {
  const insets = useSafeAreaInsets()
  const { items, summary, categories, month, isFamily, canManageFamilyBudget, isLoading, error, setMonth, fetchMeta, fetchFamilyAccess, fetchBudgets, fetchSummary, saveBudget, deleteBudget } =
    useBudgetStore()
  const [limit, setLimit] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  useEffect(() => {
    fetchMeta()
    fetchFamilyAccess()
  }, [fetchMeta, fetchFamilyAccess])

  useEffect(() => {
    fetchBudgets()
    fetchSummary()
  }, [month, isFamily, fetchBudgets, fetchSummary])

  useEffect(() => {
    if (!categories.length) return
    setSelectedCategoryId((prev) => prev ?? categories[0].id)
  }, [categories])

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId),
    [categories, selectedCategoryId]
  )

  const onSave = async () => {
    if (!selectedCategory) return
    const parsed = Number(limit)
    if (!parsed || parsed <= 0) return

    setIsSaving(true)
    try {
      await saveBudget({
        categoryId: selectedCategory.id,
        month,
        monthlyLimit: toPaise(parsed),
      })
      setLimit('')
    } finally {
      setIsSaving(false)
    }
  }
  const onDeleteBudget = (id: string) => {
    Alert.alert('Remove Budget Limit?', "This won't affect your transactions.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudget(id)
          } catch {
            Alert.alert('Delete failed', 'Failed to remove budget limit. Please try again.')
          }
        },
      },
    ])
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 24) }]}>
      <Text style={styles.eyebrow}>PLANNING</Text>
      <Text style={styles.title}>Budget</Text>
      <Text style={styles.subtitle}>Personal budgets only in offline v1.</Text>

      {(!isFamily || canManageFamilyBudget) ? (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{isFamily ? 'Set family monthly budget' : 'Set monthly budget'}</Text>
        <TextInput
          style={styles.input}
          value={month}
          onChangeText={setMonth}
          placeholder="YYYY-MM"
          placeholderTextColor={premiumTheme.colors.textSoft}
        />
        <Text style={styles.metaText}>
          Category: {selectedCategory ? `${selectedCategory.icon ?? ''} ${selectedCategory.name}` : 'No categories'}
        </Text>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.selectorList}
          style={styles.selectorWrap}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.selectorChip,
                selectedCategoryId === item.id && styles.selectorChipActive,
              ]}
              onPress={() => setSelectedCategoryId(item.id)}
            >
              <Text
                style={[
                  styles.selectorChipText,
                  selectedCategoryId === item.id && styles.selectorChipTextActive,
                ]}
              >
                {item.icon ? `${item.icon} ${item.name}` : item.name}
              </Text>
            </Pressable>
          )}
        />
        <TextInput
          style={styles.input}
          value={limit}
          onChangeText={setLimit}
          placeholder="Monthly limit in rupees"
          placeholderTextColor={premiumTheme.colors.textSoft}
          keyboardType="numeric"
        />
        <Pressable
          style={[styles.btn, (isSaving || !selectedCategory) && styles.btnDisabled]}
          onPress={onSave}
          disabled={isSaving || !selectedCategory}
        >
          <Text style={styles.btnText}>{isSaving ? 'Saving...' : 'Save budget'}</Text>
        </Pressable>
      </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.metaText}>Family budget is read-only for members. Only owner can edit.</Text>
        </View>
      )}
      {summary?.hasOverallBudget ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overall Budget</Text>
          <Text style={styles.valueText}>
            {formatINR(summary.spent ?? 0)} / {formatINR(summary.monthlyLimit ?? 0)}
          </Text>
          <Text style={styles.metaText}>
            Used {summary.percentUsed ?? 0}% · {summary.status?.replace('_', ' ') ?? 'on track'}
          </Text>
        </View>
      ) : (
        <View style={styles.summaryCard}>
          <Text style={styles.metaText}>No overall budget set for this month.</Text>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {isLoading ? <Text style={styles.metaText}>Loading budgets...</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>
                {(item.categoryIcon ?? '') + ' '}
                {item.categoryName ?? 'Overall'}
              </Text>
              {(!isFamily || canManageFamilyBudget) ? (
                <Pressable onPress={() => onDeleteBudget(item.id)}>
                  <Text style={styles.deleteText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.valueText}>
              {formatINR(item.spent)} / {formatINR(item.monthlyLimit)}
            </Text>
            <Text style={styles.metaText}>
              Used {item.percentUsed}% | Remaining {formatINR(item.remaining)}
            </Text>
          </View>
        )}
      />
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
  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  scopeChip: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#0A0A0B',
  },
  scopeChipActive: { backgroundColor: premiumTheme.colors.text },
  scopeChipText: { color: premiumTheme.colors.text, fontSize: 12, fontWeight: '600' },
  scopeChipTextActive: { color: premiumTheme.colors.accentText },
  roleBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    backgroundColor: '#0A0A0B',
  },
  roleBadgeText: { color: premiumTheme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  selectorWrap: { marginBottom: 10 },
  selectorList: { gap: 8 },
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
  btnDisabled: { opacity: 0.7 },
  btnText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
  list: { paddingBottom: 24, gap: 10 },
  summaryCard: {
    backgroundColor: premiumTheme.colors.surface,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  summaryTitle: { color: premiumTheme.colors.textMuted, marginBottom: 4, fontSize: 12, fontWeight: '600' },
  itemCard: {
    backgroundColor: premiumTheme.colors.surface,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { color: premiumTheme.colors.text, fontWeight: '600', marginBottom: 6 },
  deleteText: { color: '#FF7B7B', fontSize: 12, fontWeight: '600' },
  valueText: { color: premiumTheme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  metaText: { color: premiumTheme.colors.textMuted },
  errorText: { color: '#FF6666', marginBottom: 8 },
})
