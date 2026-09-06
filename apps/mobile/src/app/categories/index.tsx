import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { premiumTheme } from '../../theme/premium'
import { useTransactionsStore, type TransactionCategory } from '../../stores/transactions.store'

type CategoryTab = 'expense' | 'income'

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets()
  const { meta, fetchMeta, createCategory, deleteCategory } = useTransactionsStore()
  const [tab, setTab] = useState<CategoryTab>('expense')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [parentForInline, setParentForInline] = useState<string | null>(null)
  const [inlineName, setInlineName] = useState('')
  const swipeablesRef = useRef<Record<string, Swipeable | null>>({})
  const openSwipeKeyRef = useRef<string | null>(null)

  useEffect(() => {
    fetchMeta()
  }, [fetchMeta])

  const categories = meta?.categories ?? []
  const filtered = useMemo(
    () => categories.filter((item) => item.type === tab || item.type === 'both'),
    [categories, tab]
  )
  const parents = filtered.filter((item) => !item.isSubcategory)
  const children = filtered.filter((item) => item.isSubcategory)
  const systemParents = parents.filter((item) => item.isSystem)
  const customParents = parents.filter((item) => !item.isSystem)

  const childMap = useMemo(() => {
    const map = new Map<string, TransactionCategory[]>()
    for (const child of children) {
      if (!child.parentCategoryId) continue
      const list = map.get(child.parentCategoryId) ?? []
      list.push(child)
      map.set(child.parentCategoryId, list)
    }
    return map
  }, [children])

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const addInlineSubcategory = async (parent: TransactionCategory) => {
    if (!inlineName.trim()) {
      Alert.alert('Please enter a name')
      return
    }
    await createCategory({ name: inlineName.trim(), parentCategoryId: parent.id })
    setInlineName('')
    setParentForInline(null)
  }

  const onDelete = (item: TransactionCategory) => {
    Alert.alert('Delete Category?', `Are you sure you want to delete '${item.name}'?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await deleteCategory(item.id)
            if (result.deletedSubcategories > 0) {
              Alert.alert('Category deleted', `Also deleted ${result.deletedSubcategories} subcategories.`)
            }
          } catch (error) {
            Alert.alert('Cannot Delete Category', error instanceof Error ? error.message : 'Delete failed')
          }
        },
      },
    ])
  }

  const openActions = (item: TransactionCategory) => {
    if (item.isSystem) return

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          title: item.name,
        },
        (index) => {
          if (index === 1) router.push(`/categories/${item.id}/edit`)
          if (index === 2) onDelete(item)
        }
      )
      return
    }

    Alert.alert(item.name, 'Choose action', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => router.push(`/categories/${item.id}/edit`) },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) },
    ])
  }

  const onSwipeOpen = (key: string) => {
    const currentlyOpen = openSwipeKeyRef.current
    if (currentlyOpen && currentlyOpen !== key) {
      swipeablesRef.current[currentlyOpen]?.close()
    }
    openSwipeKeyRef.current = key
  }

  const onSwipeClose = (key: string) => {
    if (openSwipeKeyRef.current === key) {
      openSwipeKeyRef.current = null
    }
  }

  const renderParent = ({ item }: { item: TransactionCategory }) => {
    const subRows = childMap.get(item.id) ?? []
    const isExpanded = !!expanded[item.id]
    const parentRow = (
      <Pressable
        style={[styles.row, isExpanded && styles.rowExpanded]}
        onPress={() => toggle(item.id)}
        onLongPress={() => !item.isSystem && openActions(item)}
      >
        <Text style={styles.icon}>{item.icon ?? '📦'}</Text>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.rowMeta}>{item.isSystem ? '🔒' : `${subRows.length}`}</Text>
      </Pressable>
    )

    const renderActions = () => (
      <View style={styles.swipeActions}>
        <Pressable style={styles.swipeEdit} onPress={() => router.push(`/categories/${item.id}/edit`)}>
          <Text style={styles.swipeText}>Edit</Text>
        </Pressable>
        <Pressable style={styles.swipeDelete} onPress={() => onDelete(item)}>
          <Text style={styles.swipeText}>Delete</Text>
        </Pressable>
      </View>
    )

    return (
      <View style={styles.group}>
        {Platform.OS === 'ios' && !item.isSystem ? (
          <Swipeable
            ref={(ref) => {
              swipeablesRef.current[`parent-${item.id}`] = ref
            }}
            overshootRight={false}
            onSwipeableOpen={() => onSwipeOpen(`parent-${item.id}`)}
            onSwipeableClose={() => onSwipeClose(`parent-${item.id}`)}
            renderRightActions={renderActions}
          >
            {parentRow}
          </Swipeable>
        ) : (
          parentRow
        )}
        {isExpanded ? (
          <View style={styles.subList}>
            {subRows.map((sub) => (
              <View key={sub.id}>
                {Platform.OS === 'ios' && !sub.isSystem ? (
                  <Swipeable
                    ref={(ref) => {
                      swipeablesRef.current[`sub-${sub.id}`] = ref
                    }}
                    overshootRight={false}
                    onSwipeableOpen={() => onSwipeOpen(`sub-${sub.id}`)}
                    onSwipeableClose={() => onSwipeClose(`sub-${sub.id}`)}
                    renderRightActions={() => (
                      <View style={styles.swipeActions}>
                        <Pressable
                          style={styles.swipeEdit}
                          onPress={() => router.push(`/categories/${sub.id}/edit`)}
                        >
                          <Text style={styles.swipeText}>Edit</Text>
                        </Pressable>
                        <Pressable style={styles.swipeDelete} onPress={() => onDelete(sub)}>
                          <Text style={styles.swipeText}>Delete</Text>
                        </Pressable>
                      </View>
                    )}
                  >
                    <Pressable
                      style={styles.subRow}
                      onPress={() => !sub.isSystem && router.push(`/categories/${sub.id}/edit`)}
                      onLongPress={() => !sub.isSystem && openActions(sub)}
                    >
                      <Text style={styles.subName}>{sub.name}</Text>
                    </Pressable>
                  </Swipeable>
                ) : (
                  <Pressable
                    style={styles.subRow}
                    onPress={() => !sub.isSystem && router.push(`/categories/${sub.id}/edit`)}
                    onLongPress={() => !sub.isSystem && openActions(sub)}
                  >
                    <Text style={styles.subName}>{sub.name}</Text>
                  </Pressable>
                )}
              </View>
            ))}
            <Pressable style={styles.addSubRow} onPress={() => setParentForInline(item.id)}>
              <Text style={styles.addSubText}>+ Add subcategory</Text>
            </Pressable>
            {parentForInline === item.id ? (
              <View style={styles.inlineRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Subcategory name..."
                  placeholderTextColor={premiumTheme.colors.textSoft}
                  value={inlineName}
                  onChangeText={setInlineName}
                />
                <Pressable style={styles.inlineBtn} onPress={() => addInlineSubcategory(item)}>
                  <Text style={styles.inlineBtnText}>Add</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 24) }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/categories/new')}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(['expense', 'income'] as const).map((item) => (
          <Pressable
            key={item}
            style={[styles.tab, tab === item && styles.tabActive]}
            onPress={() => setTab(item)}
          >
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>
              {item === 'expense' ? 'Expense' : 'Income'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Default Categories</Text>
      <FlatList data={systemParents} keyExtractor={(item) => item.id} renderItem={renderParent} scrollEnabled={false} />

      <Text style={styles.section}>My Categories</Text>
      {customParents.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No custom categories yet</Text>
          <Text style={styles.emptySub}>Add your own categories to better track your spending.</Text>
        </View>
      ) : (
        <FlatList data={customParents} keyExtractor={(item) => item.id} renderItem={renderParent} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: premiumTheme.colors.text, fontSize: 28, fontWeight: '700' },
  addBtn: { backgroundColor: premiumTheme.colors.accent, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tab: { borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  tabActive: { backgroundColor: premiumTheme.colors.text },
  tabText: { color: premiumTheme.colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: premiumTheme.colors.accentText },
  section: { color: premiumTheme.colors.textMuted, marginTop: 10, marginBottom: 8, fontWeight: '600' },
  group: { marginBottom: 8 },
  row: { backgroundColor: premiumTheme.colors.surface, borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowExpanded: { borderLeftWidth: 2, borderLeftColor: '#1D9E75' },
  icon: { fontSize: 18 },
  name: { color: premiumTheme.colors.text, fontWeight: '600', flex: 1 },
  rowMeta: { color: premiumTheme.colors.textMuted, fontWeight: '700' },
  swipeActions: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 2 },
  swipeEdit: {
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: 8,
    marginLeft: 8,
  },
  swipeDelete: {
    backgroundColor: '#B91C1C',
    justifyContent: 'center',
    alignItems: 'center',
    width: 86,
    borderRadius: 8,
    marginLeft: 8,
  },
  swipeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  subList: { marginTop: 6, marginLeft: 16, gap: 6 },
  subRow: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#0E0E10' },
  subName: { color: premiumTheme.colors.textMuted },
  addSubRow: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#1D9E75', borderRadius: 10, padding: 10 },
  addSubText: { color: '#1D9E75', fontWeight: '600' },
  inlineRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 10, padding: 10, color: premiumTheme.colors.text, backgroundColor: '#0A0A0B' },
  inlineBtn: { backgroundColor: premiumTheme.colors.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  inlineBtnText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
  empty: { backgroundColor: premiumTheme.colors.surface, borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 12, padding: 14 },
  emptyTitle: { color: premiumTheme.colors.text, fontWeight: '700', marginBottom: 4 },
  emptySub: { color: premiumTheme.colors.textMuted },
})
