import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAccountStore } from '../../stores/account.store'
import { premiumTheme } from '../../theme/premium'
import { formatINR } from '../../utils/money'

export default function AccountsScreen() {
  const { accounts, fetchAccounts, reorderAccounts, deleteAccount } = useAccountStore()
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const sorted = useMemo(() => [...accounts], [accounts])
  const assets = useMemo(
    () => sorted.filter((a) => ['cash', 'bank', 'wallet', 'savings'].includes(a.type)),
    [sorted]
  )
  const liabilities = useMemo(
    () => sorted.filter((a) => ['credit_card', 'loan'].includes(a.type)),
    [sorted]
  )

  const move = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= sorted.length) return
    const clone = [...sorted]
    const [item] = clone.splice(index, 1)
    clone.splice(nextIndex, 0, item)
    await reorderAccounts(clone.map((account) => account.id))
  }

  const openActions = (accountId: string) => {
    setActiveActionsId((current) => (current === accountId ? null : accountId))
  }

  const confirmDelete = (accountId: string) => {
    Alert.alert('Delete Account?', 'Are you sure you want to delete this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount(accountId)
            setActiveActionsId(null)
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Delete failed')
          }
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Accounts</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/accounts/new')}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No accounts yet</Text>
          <Text style={styles.emptyText}>
            Add your first account to start tracking your finances.
          </Text>
          <Pressable style={styles.addBtn} onPress={() => router.push('/accounts/new')}>
            <Text style={styles.addBtnText}>Add Account</Text>
          </Pressable>
        </View>
      ) : null}

      {assets.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Assets</Text>
          <FlatList
            data={assets}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <View>
                <Pressable
                  style={styles.card}
                  onPress={() => router.push(`/accounts/${item.id}`)}
                  onLongPress={() => openActions(item.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={[styles.colorDot, { backgroundColor: item.color ?? '#1D9E75' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardSub}>{item.type}</Text>
                      <Text style={styles.cardAmount}>{formatINR(item.availableBalance)}</Text>
                    </View>
                  </View>
                  <View style={styles.reorderCol}>
                    <Pressable style={styles.reorderBtn} onPress={() => move(index, -1)}>
                      <Text style={styles.reorderText}>↑</Text>
                    </Pressable>
                    <Pressable style={styles.reorderBtn} onPress={() => move(index, 1)}>
                      <Text style={styles.reorderText}>↓</Text>
                    </Pressable>
                  </View>
                </Pressable>
                {activeActionsId === item.id ? (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => router.push(`/accounts/${item.id}/edit`)}
                    >
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.actionDangerBtn} onPress={() => confirmDelete(item.id)}>
                      <Text style={styles.actionDangerText}>Delete</Text>
                    </Pressable>
                    {Platform.OS === 'ios' ? (
                      <Text style={styles.hintText}>iOS: swipe pattern can be added later</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            )}
          />
        </>
      ) : null}

      {liabilities.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Liabilities</Text>
          <FlatList
            data={liabilities}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <View>
                <Pressable
                  style={styles.card}
                  onPress={() => router.push(`/accounts/${item.id}`)}
                  onLongPress={() => openActions(item.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={[styles.colorDot, { backgroundColor: item.color ?? '#BA7517' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardSub}>{item.type}</Text>
                      <Text style={styles.cardAmount}>{formatINR(item.availableBalance)}</Text>
                      {item.type === 'credit_card' && item.creditLimit ? (
                        <>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, Math.round((item.currentBalance / item.creditLimit) * 100))
                                  )}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressLabel}>
                            Credit used {Math.round((item.currentBalance / item.creditLimit) * 100)}%
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.reorderCol}>
                    <Pressable style={styles.reorderBtn} onPress={() => move(index, -1)}>
                      <Text style={styles.reorderText}>↑</Text>
                    </Pressable>
                    <Pressable style={styles.reorderBtn} onPress={() => move(index, 1)}>
                      <Text style={styles.reorderText}>↓</Text>
                    </Pressable>
                  </View>
                </Pressable>
                {activeActionsId === item.id ? (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => router.push(`/accounts/${item.id}/edit`)}
                    >
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.actionDangerBtn} onPress={() => confirmDelete(item.id)}>
                      <Text style={styles.actionDangerText}>Delete</Text>
                    </Pressable>
                    {Platform.OS === 'ios' ? (
                      <Text style={styles.hintText}>iOS: swipe pattern can be added later</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            )}
          />
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg, padding: 20, paddingTop: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: premiumTheme.colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.4 },
  addBtn: {
    backgroundColor: premiumTheme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
  list: { gap: 10, paddingBottom: 24 },
  sectionTitle: {
    color: premiumTheme.colors.textMuted,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
    letterSpacing: 0.4,
  },
  emptyState: {
    backgroundColor: premiumTheme.colors.surface,
    borderColor: premiumTheme.colors.border,
    borderWidth: 1,
    borderRadius: premiumTheme.radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  emptyTitle: { color: premiumTheme.colors.text, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: premiumTheme.colors.textMuted, marginBottom: 10 },
  card: {
    backgroundColor: premiumTheme.colors.surface,
    borderColor: premiumTheme.colors.border,
    borderWidth: 1,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: { width: 12, height: 12, borderRadius: 999 },
  cardTitle: { color: premiumTheme.colors.text, fontWeight: '600', fontSize: 16 },
  cardSub: { color: premiumTheme.colors.textMuted, marginTop: 4, marginBottom: 8 },
  cardAmount: { color: premiumTheme.colors.text, fontWeight: '700', fontSize: 18 },
  progressTrack: {
    height: 6,
    backgroundColor: '#2A2A2F',
    borderRadius: 999,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF7B7B',
  },
  progressLabel: {
    color: premiumTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  reorderCol: { gap: 8, marginLeft: 12 },
  reorderBtn: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: 8,
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderText: { color: premiumTheme.colors.text, fontWeight: '700' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -4,
    marginBottom: 8,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionBtnText: { color: premiumTheme.colors.text, fontWeight: '600' },
  actionDangerBtn: {
    borderWidth: 1,
    borderColor: '#7E2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionDangerText: { color: '#FF7B7B', fontWeight: '700' },
  hintText: { color: premiumTheme.colors.textSoft, fontSize: 11 },
})
