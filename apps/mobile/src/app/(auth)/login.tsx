import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/auth.store'
import { useAccountStore } from '../../stores/account.store'
import { premiumTheme } from '../../theme/premium'

export default function WelcomeScreen() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const startOffline = useAuthStore((s) => s.startOffline)
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts)

  const handleStart = async () => {
    if (!name.trim()) {
      setError('Enter your name to start.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      await startOffline(name.trim())
      await fetchAccounts()
      const hasAccounts = useAccountStore.getState().accounts.length > 0
      router.replace(hasAccounts ? '/(tabs)/' : '/onboarding/accounts')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not start offline profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>EXPENSE TRACKER · V1 OFFLINE</Text>
      <Text style={styles.title}>Your money stays on this phone</Text>
      <Text style={styles.subtitle}>
        No login, no server. Accounts, transactions, and budgets are saved locally.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        editable={!isSubmitting}
      />
      <TouchableOpacity style={[styles.btn, isSubmitting && styles.btnDisabled]} onPress={handleStart} disabled={isSubmitting}>
        <Text style={styles.btnText}>{isSubmitting ? 'Starting...' : 'Get started'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: premiumTheme.colors.bg },
  eyebrow: { color: premiumTheme.colors.textSoft, letterSpacing: 2, fontSize: 11, marginBottom: 10, fontWeight: '600' },
  title: { fontSize: 34, fontWeight: '700', marginBottom: 8, color: premiumTheme.colors.text, letterSpacing: -0.6 },
  subtitle: { color: premiumTheme.colors.textMuted, marginBottom: 24, fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    color: premiumTheme.colors.text,
    backgroundColor: premiumTheme.colors.surface,
  },
  btn: { backgroundColor: premiumTheme.colors.accent, borderRadius: premiumTheme.radius.md, padding: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: premiumTheme.colors.accentText, fontWeight: '700', fontSize: 16 },
  error: { color: '#FF6666', marginBottom: 12 },
})
