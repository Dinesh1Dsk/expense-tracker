import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAccountStore } from '../../../stores/account.store'
import { premiumTheme } from '../../../theme/premium'
import { toPaise } from '../../../utils/money'

const palette = ['#1D9E75', '#378ADD', '#BA7517', '#D85A30', '#7F77DD', '#D4537E', '#639922', '#888780']

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { accounts, fetchAccounts, updateAccount } = useAccountStore()
  const account = useMemo(() => accounts.find((item) => item.id === id), [accounts, id])

  const [name, setName] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [outstandingBalance, setOutstandingBalance] = useState('')
  const [color, setColor] = useState(palette[0])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    if (!account) return
    setName(account.name)
    setInstitutionName((account as any).institutionName ?? '')
    setColor((account as any).color ?? palette[0])
    setCreditLimit((account as any).creditLimit ? String((account as any).creditLimit / 100) : '')
    setOutstandingBalance(
      (account as any).outstandingBalance ? String((account as any).outstandingBalance / 100) : ''
    )
  }, [account])

  if (!account) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Account not found</Text>
      </View>
    )
  }

  const onSave = async () => {
    if (!name.trim()) return Alert.alert('Validation', 'Please enter an account name')
    setIsSaving(true)
    try {
      await updateAccount(account.id, {
        name: name.trim(),
        color,
        institutionName: institutionName.trim() || undefined,
        creditLimit: creditLimit ? toPaise(Number(creditLimit)) : undefined,
        outstandingBalance: outstandingBalance ? toPaise(Number(outstandingBalance)) : undefined,
      })
      Alert.alert('Saved', 'Account updated')
      router.back()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Account</Text>
      <Text style={styles.help}>Type and opening balance are locked after creation.</Text>
      <TextInput style={styles.input} placeholder="Account name" placeholderTextColor={premiumTheme.colors.textSoft} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Bank/provider name" placeholderTextColor={premiumTheme.colors.textSoft} value={institutionName} onChangeText={setInstitutionName} />
      {account.type === 'credit_card' ? (
        <TextInput style={styles.input} placeholder="Credit limit (₹)" placeholderTextColor={premiumTheme.colors.textSoft} value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" />
      ) : null}
      {account.type === 'loan' ? (
        <TextInput style={styles.input} placeholder="Outstanding balance (₹)" placeholderTextColor={premiumTheme.colors.textSoft} value={outstandingBalance} onChangeText={setOutstandingBalance} keyboardType="numeric" />
      ) : null}
      <Text style={styles.help}>Icon color</Text>
      <View style={styles.colorWrap}>
        {palette.map((swatch) => (
          <Pressable
            key={swatch}
            style={[
              styles.swatch,
              { backgroundColor: swatch },
              color === swatch && styles.swatchActive,
            ]}
            onPress={() => setColor(swatch)}
          />
        ))}
      </View>
      <Pressable style={[styles.btn, isSaving && styles.btnDisabled]} onPress={onSave} disabled={isSaving}>
        <Text style={styles.btnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg, padding: 20, paddingTop: 24 },
  title: { color: premiumTheme.colors.text, fontSize: 28, fontWeight: '700', marginBottom: 8 },
  help: { color: premiumTheme.colors.textMuted, marginBottom: 14 },
  colorWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    backgroundColor: '#0A0A0B',
    color: premiumTheme.colors.text,
    padding: 12,
    marginBottom: 10,
  },
  btn: { backgroundColor: premiumTheme.colors.accent, borderRadius: premiumTheme.radius.md, padding: 13, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
  swatch: { width: 30, height: 30, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: '#FFFFFF' },
})
