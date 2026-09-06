import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/auth.store'
import { useAccountStore } from '../../stores/account.store'
import { premiumTheme } from '../../theme/premium'

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const register = useAuthStore((s) => s.register)
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts)

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, and password are required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      await register(name.trim(), email.trim().toLowerCase(), password)
      await fetchAccounts()
      const hasAccounts = useAccountStore.getState().accounts.length > 0
      router.replace(hasAccounts ? '/(tabs)/' : '/onboarding/accounts')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>EXPENSE TRACKER</Text>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Build your private, premium finance space.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} editable={!isSubmitting} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!isSubmitting} />
      <TextInput style={styles.input} placeholder="Password (min 8 chars)" value={password} onChangeText={setPassword} secureTextEntry editable={!isSubmitting} />
      <TouchableOpacity style={[styles.btn, isSubmitting && styles.btnDisabled]} onPress={handleRegister} disabled={isSubmitting}>
        <Text style={styles.btnText}>{isSubmitting ? 'Creating account...' : 'Register'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Already have an account? Login</Text>
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
  link: { textAlign: 'center', marginTop: 16, color: premiumTheme.colors.textMuted },
})
