import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAccountStore } from '../../stores/account.store'
import { premiumTheme } from '../../theme/premium'
import { formatINR } from '../../utils/money'

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { accounts, fetchAccounts, deleteAccount } = useAccountStore()

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const account = useMemo(() => accounts.find((item) => item.id === id), [accounts, id])

  if (!account) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Account not found</Text>
      </View>
    )
  }

  const onDelete = async () => {
    const variantBody =
      'This account has transactions. Deleting will permanently remove this account and all transaction history. This cannot be undone.'
    const fallbackBody = `Are you sure you want to delete '${account.name}'? This cannot be undone.`

    Alert.alert('Delete Account?', account.currentBalance !== 0 ? variantBody : fallbackBody, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: account.currentBalance !== 0 ? 'Delete Permanently' : 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await deleteAccount(account.id)
            if ((result.cancelledUpcoming ?? 0) > 0) {
              Alert.alert(
                'Account deleted',
                `Deleted account and cancelled ${result.cancelledUpcoming} linked upcoming payment(s).`
              )
            } else if (result.hadTransactions) {
              Alert.alert(
                'Delete Account?',
                `This account had ${result.transactionCount} transactions. It was archived to preserve ledger integrity.`
              )
            } else {
              Alert.alert('Account deleted', 'Account removed successfully.')
            }
            router.replace('/accounts')
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Failed to delete account. Please try again.'
            if (message.toLowerCase().includes('pending upcoming payment')) {
              Alert.alert('Cannot Delete Account', message, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete & Cancel Upcoming',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const result = await deleteAccount(account.id, { forceCleanup: true })
                      Alert.alert(
                        'Account deleted',
                        `Deleted account${
                          (result.cancelledUpcoming ?? 0) > 0
                            ? ` and cancelled ${result.cancelledUpcoming} linked upcoming payment(s)`
                            : ''
                        }.`
                      )
                      router.replace('/accounts')
                    } catch (innerError) {
                      const innerMessage =
                        innerError instanceof Error
                          ? innerError.message
                          : 'Failed to delete account. Please try again.'
                      Alert.alert('Delete failed', innerMessage)
                    }
                  },
                },
              ])
            } else {
              Alert.alert('Delete failed', message)
            }
          }
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{account.name}</Text>
      <Text style={styles.sub}>{account.type}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Current Balance</Text>
        <Text style={styles.value}>{formatINR(account.currentBalance)}</Text>
        <Text style={styles.label}>Upcoming Payments</Text>
        <Text style={styles.warn}>- {formatINR(account.pendingUpcoming)}</Text>
        <Text style={styles.label}>Available Balance</Text>
        <Text style={styles.value}>{formatINR(account.availableBalance)}</Text>
      </View>

      <Pressable style={styles.btnSecondary} onPress={() => router.push(`/accounts/${account.id}/edit`)}>
        <Text style={styles.btnSecondaryText}>Edit Account</Text>
      </Pressable>
      <Pressable style={styles.btnDanger} onPress={onDelete}>
        <Text style={styles.btnDangerText}>Delete Account</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg, padding: 20, paddingTop: 24 },
  title: { color: premiumTheme.colors.text, fontSize: 28, fontWeight: '700' },
  sub: { color: premiumTheme.colors.textMuted, marginBottom: 14 },
  card: {
    backgroundColor: premiumTheme.colors.surface,
    borderColor: premiumTheme.colors.border,
    borderWidth: 1,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    marginBottom: 14,
  },
  label: { color: premiumTheme.colors.textMuted, marginBottom: 4 },
  value: { color: premiumTheme.colors.text, fontWeight: '700', fontSize: 20, marginBottom: 10 },
  warn: { color: '#F7B267', fontWeight: '700', marginBottom: 10 },
  btnSecondary: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnSecondaryText: { color: premiumTheme.colors.text, fontWeight: '600' },
  btnDanger: {
    borderWidth: 1,
    borderColor: '#7E2A2A',
    borderRadius: premiumTheme.radius.md,
    padding: 12,
    alignItems: 'center',
  },
  btnDangerText: { color: '#FF7B7B', fontWeight: '700' },
})
