import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { type AccountType, useAccountStore } from '../../stores/account.store'
import { premiumTheme } from '../../theme/premium'
import { toPaise } from '../../utils/money'

const types: AccountType[] = ['cash', 'bank', 'wallet', 'credit_card', 'savings', 'loan']

export default function OnboardingAccountsScreen() {
  const { accounts, createAccount } = useAccountStore()
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [type, setType] = useState<AccountType>('bank')
  const [isSaving, setIsSaving] = useState(false)

  const hasAtLeastOne = useMemo(() => accounts.length > 0, [accounts.length])

  const add = async () => {
    if (!name.trim()) return
    const value = Number(balance || '0')
    if (Number.isNaN(value) || value < 0) return
    setIsSaving(true)
    try {
      await createAccount({
        name: name.trim(),
        type,
        openingBalance: toPaise(value),
      })
      setName('')
      setBalance('')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.step}>Step 2 of 4</Text>
      <Text style={styles.title}>Add your accounts</Text>
      <Text style={styles.subtitle}>
        Add the accounts you use to track your money. You can add more later.
      </Text>

      <View style={styles.rowWrap}>
        {types.map((item) => (
          <Pressable
            key={item}
            style={[styles.chip, type === item && styles.chipActive]}
            onPress={() => setType(item)}
          >
            <Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Account name"
        placeholderTextColor={premiumTheme.colors.textSoft}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Opening balance"
        placeholderTextColor={premiumTheme.colors.textSoft}
        value={balance}
        onChangeText={setBalance}
        keyboardType="numeric"
      />
      <Pressable style={[styles.btn, isSaving && styles.disabled]} onPress={add} disabled={isSaving}>
        <Text style={styles.btnText}>{isSaving ? 'Adding...' : 'Add Account'}</Text>
      </Pressable>

      <View style={styles.bottomRow}>
        <Pressable onPress={() => router.replace('/(tabs)/')}>
          <Text style={styles.skip}>Skip for now</Text>
        </Pressable>
        <Pressable
          style={[styles.continueBtn, !hasAtLeastOne && styles.disabled]}
          disabled={!hasAtLeastOne}
          onPress={() => router.replace('/(tabs)/')}
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg, padding: 20, paddingTop: 24 },
  step: { color: premiumTheme.colors.textSoft, marginBottom: 8 },
  title: { color: premiumTheme.colors.text, fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: premiumTheme.colors.textMuted, marginBottom: 14 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: premiumTheme.colors.text },
  chipText: { color: premiumTheme.colors.text, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: premiumTheme.colors.accentText },
  input: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    backgroundColor: '#0A0A0B',
    color: premiumTheme.colors.text,
    padding: 12,
    marginBottom: 10,
  },
  btn: { backgroundColor: premiumTheme.colors.accent, borderRadius: premiumTheme.radius.md, padding: 12, alignItems: 'center' },
  btnText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  skip: { color: premiumTheme.colors.textMuted },
  continueBtn: { backgroundColor: premiumTheme.colors.accent, borderRadius: premiumTheme.radius.md, paddingHorizontal: 16, paddingVertical: 10 },
  continueText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
})
