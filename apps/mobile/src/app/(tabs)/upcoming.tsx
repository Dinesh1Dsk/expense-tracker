import { useEffect, useState } from 'react'
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { premiumTheme } from '../../theme/premium'
import { formatINR } from '../../utils/money'
import { useUpcomingStore } from '../../stores/upcoming.store'
import { useAccountStore } from '../../stores/account.store'
import { scheduleReminder } from '../../lib/notifications'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function UpcomingScreen() {
  const getRowStatus = (item: (typeof items)[number]) => {
    if (item.status === 'paid') return 'paid' as const
    const due = new Date(item.dueDate)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    if (dueStart.getTime() < todayStart.getTime()) return 'overdue' as const
    if (dueStart.getTime() === todayStart.getTime()) return 'today' as const
    return 'pending' as const
  }

  const getStatusLabel = (status: 'pending' | 'today' | 'overdue' | 'paid') => {
    if (status === 'today') return 'Due today'
    if (status === 'overdue') return 'Overdue'
    if (status === 'paid') return 'Paid'
    return 'Pending'
  }

  const insets = useSafeAreaInsets()
  const {
    items,
    totalPending,
    pendingCount,
    overdueCount,
    isLoading,
    error,
    fetchUpcoming,
    markPaid,
    skipPayment,
    deletePayment,
  } = useUpcomingStore()
  const { accounts, fetchAccounts } = useAccountStore()
  const [accountPickerOpen, setAccountPickerOpen] = useState(false)
  const [pendingMarkPaidId, setPendingMarkPaidId] = useState<string | null>(null)

  useEffect(() => {
    fetchUpcoming()
    fetchAccounts()
  }, [fetchUpcoming, fetchAccounts])

  const grouped = {
    emis: items.filter((i) => i.type === 'emi' && i.status !== 'paid'),
    recurring: items.filter((i) => i.type === 'recurring' && i.status !== 'paid'),
    onetime: items.filter((i) => i.type === 'one_time' && i.status !== 'paid'),
    paid: items.filter((i) => i.status === 'paid'),
  }
  const sections = [
    { title: 'EMIs', data: grouped.emis },
    { title: 'Recurring', data: grouped.recurring },
    { title: 'One-time', data: grouped.onetime },
    { title: 'Paid', data: grouped.paid },
  ].filter((s) => s.data.length > 0)

  const askMarkPaid = (item: (typeof items)[number]) => {
    const confirm = (accountId?: string) =>
      Alert.alert('Mark as Paid?', 'This will mark current cycle as paid.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Paid', onPress: () => markPaid(item.id, accountId) },
      ])

    if (item.accountId) {
      confirm(item.accountId)
      return
    }
    if (!accounts.length) {
      Alert.alert('No accounts', 'Create an account before marking payment as paid.')
      return
    }
    setPendingMarkPaidId(item.id)
    setAccountPickerOpen(true)
  }

  const askSkip = (id: string) =>
    Alert.alert('Skip this cycle?', 'This will skip this cycle and schedule next one.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Skip', onPress: () => skipPayment(id) },
    ])

  const askDelete = (id: string) =>
    Alert.alert('Delete payment?', 'This will remove this payment.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePayment(id) },
    ])

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 24) }]}>
      <Text style={styles.eyebrow}>REMINDERS</Text>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Upcoming Payments</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/upcoming/new')}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Pending forecast</Text>
        <Text style={styles.summaryValue}>{formatINR(totalPending)}</Text>
        <Text style={styles.summaryMeta}>
          {pendingCount} pending · {overdueCount} overdue
        </Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isLoading ? <Text style={styles.help}>Loading upcoming payments...</Text> : null}
      <FlatList
        data={sections}
        keyExtractor={(section) => section.title}
        contentContainerStyle={styles.list}
        renderItem={({ item: section }) => (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.data.map((item) => (
              <View style={styles.card} key={item.id}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  {(() => {
                    const rowStatus = getRowStatus(item)
                    return (
                      <>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardTitle}>{item.name}</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              rowStatus === 'overdue'
                                ? styles.statusOverdue
                                : rowStatus === 'today'
                                  ? styles.statusToday
                                  : rowStatus === 'paid'
                                    ? styles.statusPaid
                                    : styles.statusPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                rowStatus === 'overdue'
                                  ? styles.statusOverdueText
                                  : rowStatus === 'today'
                                    ? styles.statusTodayText
                                    : rowStatus === 'paid'
                                      ? styles.statusPaidText
                                      : styles.statusPendingText,
                              ]}
                            >
                              {getStatusLabel(rowStatus)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardSub}>
                          {new Date(item.dueDate).toLocaleDateString('en-IN')} · {item.type}
                        </Text>
                        <Text
                          style={[
                            styles.cardAmount,
                            rowStatus === 'overdue'
                              ? styles.amountOverdue
                              : rowStatus === 'today'
                                ? styles.amountToday
                                : rowStatus === 'paid'
                                  ? styles.amountPaid
                                  : null,
                          ]}
                        >
                          {formatINR(item.amount)}
                        </Text>
                      </>
                    )
                  })()}
                </View>
                <View style={styles.actions}>
                  {item.status !== 'paid' ? (
                    <Pressable style={styles.btnSecondary} onPress={() => askMarkPaid(item)}>
                      <Text style={styles.btnSecondaryText}>Mark paid</Text>
                    </Pressable>
                  ) : null}
                  {item.status !== 'paid' && item.type !== 'one_time' ? (
                    <Pressable style={styles.btnSecondary} onPress={() => askSkip(item.id)}>
                      <Text style={styles.btnSecondaryText}>Skip</Text>
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.btnSecondary} onPress={() => askDelete(item.id)}>
                    <Text style={styles.btnDangerText}>Delete</Text>
                  </Pressable>
                  <Pressable
                    style={styles.btnPrimary}
                    onPress={async () =>
                      scheduleReminder(
                        `Payment due: ${item.name}`,
                        `Amount ${formatINR(item.amount)}`,
                        new Date(item.dueDate)
                      )
                    }
                  >
                    <Text style={styles.btnPrimaryText}>Remind</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      />
      <Modal visible={accountPickerOpen} transparent animationType="fade" onRequestClose={() => setAccountPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Choose account</Text>
            <Text style={styles.modalSub}>Select which account was used for this payment.</Text>
            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalRow}
                  onPress={() => {
                    if (pendingMarkPaidId) {
                      void markPaid(pendingMarkPaidId, item.id)
                    }
                    setPendingMarkPaidId(null)
                    setAccountPickerOpen(false)
                  }}
                >
                  <Text style={styles.modalRowText}>{item.name}</Text>
                </Pressable>
              )}
            />
            <Pressable
              style={styles.modalCancel}
              onPress={() => {
                setPendingMarkPaidId(null)
                setAccountPickerOpen(false)
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg, paddingHorizontal: 20 },
  eyebrow: { color: premiumTheme.colors.textSoft, letterSpacing: 2, fontSize: 11, fontWeight: '600', marginBottom: 8 },
  title: { color: premiumTheme.colors.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.5, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#0A0A0B',
    marginBottom: 12,
  },
  addBtnText: { color: premiumTheme.colors.text, fontWeight: '700', fontSize: 12 },
  summary: {
    backgroundColor: premiumTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  summaryLabel: { color: premiumTheme.colors.textMuted, marginBottom: 6 },
  summaryValue: { color: premiumTheme.colors.text, fontSize: 24, fontWeight: '700' },
  summaryMeta: { color: premiumTheme.colors.textMuted, marginTop: 6, fontSize: 12 },
  error: { color: '#FF6666', marginBottom: 8 },
  help: { color: premiumTheme.colors.textMuted, marginBottom: 8 },
  list: { paddingBottom: 24, gap: 10 },
  sectionWrap: { gap: 8 },
  sectionTitle: { color: premiumTheme.colors.textMuted, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: premiumTheme.colors.surface,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: premiumTheme.colors.text, fontWeight: '600', marginBottom: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardSub: { color: premiumTheme.colors.textMuted, marginBottom: 6 },
  cardAmount: { color: premiumTheme.colors.text, fontWeight: '700' },
  amountOverdue: { color: '#E24B4A' },
  amountToday: { color: '#BA7517' },
  amountPaid: { color: '#1D9E75' },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statusPending: { backgroundColor: '#FAEEDA' },
  statusPendingText: { color: '#854F0B' },
  statusToday: { backgroundColor: '#FEF3F2' },
  statusTodayText: { color: '#991B1B' },
  statusOverdue: { backgroundColor: '#FEF2F2' },
  statusOverdueText: { color: '#DC2626' },
  statusPaid: { backgroundColor: '#E1F5EE' },
  statusPaidText: { color: '#0F6E56' },
  actions: { gap: 8 },
  btnSecondary: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnSecondaryText: { color: premiumTheme.colors.text, fontWeight: '600' },
  btnDangerText: { color: '#FF7B7B', fontWeight: '700' },
  btnPrimary: {
    backgroundColor: premiumTheme.colors.accent,
    borderRadius: premiumTheme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnPrimaryText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalSheet: {
    backgroundColor: premiumTheme.colors.surface,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    maxHeight: '70%',
  },
  modalTitle: { color: premiumTheme.colors.text, fontSize: 16, fontWeight: '700' },
  modalSub: { color: premiumTheme.colors.textMuted, marginTop: 4, marginBottom: 8, fontSize: 12 },
  modalRow: {
    borderBottomWidth: 1,
    borderBottomColor: premiumTheme.colors.border,
    paddingVertical: 12,
  },
  modalRowText: { color: premiumTheme.colors.text, fontWeight: '600' },
  modalCancel: { marginTop: 10, alignSelf: 'flex-end' },
  modalCancelText: { color: premiumTheme.colors.textMuted, fontWeight: '700' },
})
