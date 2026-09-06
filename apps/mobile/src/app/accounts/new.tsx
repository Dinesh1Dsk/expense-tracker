import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { type AccountType, useAccountStore } from '../../stores/account.store'
import { premiumTheme } from '../../theme/premium'
import { toPaise } from '../../utils/money'

const types: AccountType[] = ['cash', 'bank', 'wallet', 'credit_card', 'savings', 'loan']
const palette = ['#1D9E75', '#378ADD', '#BA7517', '#D85A30', '#7F77DD', '#D4537E', '#639922', '#888780']

export default function AddAccountScreen() {
  const createAccount = useAccountStore((s) => s.createAccount)
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('bank')
  const [openingBalance, setOpeningBalance] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [outstandingBalance, setOutstandingBalance] = useState('')
  const [color, setColor] = useState(palette[0])
  const [isSaving, setIsSaving] = useState(false)

  const onCreate = async () => {
    if (!name.trim()) return Alert.alert('Validation', 'Please enter an account name')
    const opening = Number(openingBalance || '0')
    if (Number.isNaN(opening) || opening < 0) return Alert.alert('Validation', 'Please enter a valid amount')
    if (type === 'credit_card' && (!creditLimit || Number(creditLimit) <= 0)) {
      return Alert.alert('Validation', 'Please enter your credit limit')
    }
    if (type === 'loan' && (!outstandingBalance || Number(outstandingBalance) <= 0)) {
      return Alert.alert('Validation', 'Please enter outstanding balance')
    }

    setIsSaving(true)
    try {
      await createAccount({
        name: name.trim(),
        type,
        openingBalance: toPaise(opening),
        color,
        institutionName: institutionName.trim() || undefined,
        creditLimit: creditLimit ? toPaise(Number(creditLimit)) : undefined,
        outstandingBalance: outstandingBalance ? toPaise(Number(outstandingBalance)) : undefined,
      })
      Alert.alert('Success', 'Account created successfully')
      router.back()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Account</Text>
      <Text style={styles.label}>Account Type</Text>
      <View style={styles.typeWrap}>
        {types.map((item) => (
          <Pressable
            key={item}
            style={[styles.typeChip, type === item && styles.typeChipActive]}
            onPress={() => setType(item)}
          >
            <Text style={[styles.typeChipText, type === item && styles.typeChipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Account name" placeholderTextColor={premiumTheme.colors.textSoft} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Opening balance (₹)" placeholderTextColor={premiumTheme.colors.textSoft} value={openingBalance} onChangeText={setOpeningBalance} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Bank / provider name" placeholderTextColor={premiumTheme.colors.textSoft} value={institutionName} onChangeText={setInstitutionName} />
      {type === 'credit_card' ? (
        <TextInput style={styles.input} placeholder="Credit limit (₹)" placeholderTextColor={premiumTheme.colors.textSoft} value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" />
      ) : null}
      {type === 'loan' ? (
        <TextInput style={styles.input} placeholder="Outstanding balance (₹)" placeholderTextColor={premiumTheme.colors.textSoft} value={outstandingBalance} onChangeText={setOutstandingBalance} keyboardType="numeric" />
      ) : null}
      <Text style={styles.label}>Icon color</Text>
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

      <Pressable style={[styles.btn, isSaving && styles.btnDisabled]} onPress={onCreate} disabled={isSaving}>
        <Text style={styles.btnText}>{isSaving ? 'Creating...' : 'Create Account'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg, padding: 20, paddingTop: 24 },
  title: { color: premiumTheme.colors.text, fontSize: 28, fontWeight: '700', marginBottom: 16 },
  label: { color: premiumTheme.colors.textMuted, marginBottom: 8 },
  typeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  colorWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  typeChip: { borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  typeChipActive: { backgroundColor: premiumTheme.colors.text },
  typeChipText: { color: premiumTheme.colors.text, fontWeight: '600', fontSize: 12 },
  typeChipTextActive: { color: premiumTheme.colors.accentText },
  swatch: { width: 30, height: 30, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: '#FFFFFF' },
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
})
