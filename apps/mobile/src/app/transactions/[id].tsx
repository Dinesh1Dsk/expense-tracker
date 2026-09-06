import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { apiRequest } from '../../api/client'
import { premiumTheme } from '../../theme/premium'
import { formatINR } from '../../utils/money'

interface TransactionDetail {
  id: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  note: string | null
  isReversal: boolean
  isReversed: boolean
  reversalId: string | null
  referenceId: string | null
  transactedAt: string
  runningBalance: number
  category: { name: string; icon: string | null; color: string | null }
  account: { name: string; type: string }
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [item, setItem] = useState<TransactionDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiRequest<TransactionDetail>(`/transactions/${id}`)
      .then(setItem)
      .finally(() => setLoading(false))
  }, [id])

  const reverse = async () => {
    if (!item) return
    Alert.alert('Reverse Transaction?', 'This will create a reversal entry and keep both rows in ledger.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Reverse',
        style: 'destructive',
        onPress: async () => {
          await apiRequest(`/transactions/${item.id}/reverse`, { method: 'POST' })
          router.back()
        },
      },
    ])
  }

  if (loading || !item) {
    return (
      <View style={styles.container}>
        <Text style={styles.meta}>Loading transaction...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Transaction Detail</Text>
      <View style={styles.card}>
        <Text style={styles.amount}>
          {item.type === 'DEBIT' ? '-' : '+'}
          {formatINR(item.amount)}
        </Text>
        <Text style={styles.meta}>{item.category.icon ?? '📦'} {item.category.name}</Text>
        <Text style={styles.meta}>Account: {item.account.name}</Text>
        <Text style={styles.meta}>Date: {new Date(item.transactedAt).toLocaleString('en-IN')}</Text>
        <Text style={styles.meta}>Balance after: {formatINR(item.runningBalance)}</Text>
        <Text style={styles.meta}>Note: {item.note ?? '—'}</Text>
        <Text style={styles.meta}>Transaction ID: {item.id}</Text>
      </View>
      {item.isReversal ? <Text style={styles.info}>This is a reversal of {item.referenceId}</Text> : null}
      {item.isReversed ? <Text style={styles.warn}>This transaction was reversed.</Text> : null}
      {!item.isReversal && !item.isReversed ? (
        <Pressable style={styles.reverseBtn} onPress={reverse}>
          <Text style={styles.reverseBtnText}>Reverse Transaction</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg },
  content: { padding: 20, gap: 10 },
  title: { color: premiumTheme.colors.text, fontSize: 28, fontWeight: '700' },
  card: { backgroundColor: premiumTheme.colors.surface, borderColor: premiumTheme.colors.border, borderWidth: 1, borderRadius: 12, padding: 14, gap: 6 },
  amount: { color: premiumTheme.colors.text, fontSize: 24, fontWeight: '700' },
  meta: { color: premiumTheme.colors.textMuted },
  info: { color: '#5FA8FF' },
  warn: { color: '#F7B267' },
  reverseBtn: { borderWidth: 1, borderColor: '#B91C1C', borderRadius: 10, padding: 12, alignItems: 'center' },
  reverseBtnText: { color: '#FF7B7B', fontWeight: '700' },
})
