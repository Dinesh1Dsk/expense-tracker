import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { premiumTheme } from '../../theme/premium'
import { toPaise } from '../../utils/money'
import { useUpcomingStore } from '../../stores/upcoming.store'

type PaymentType = 'one_time' | 'recurring' | 'emi'

export default function NewUpcomingPaymentScreen() {
  const insets = useSafeAreaInsets()
  const { createPayment } = useUpcomingStore()
  const [type, setType] = useState<PaymentType>('one_time')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [recurrenceDay, setRecurrenceDay] = useState('')
  const [emiTotalMonths, setEmiTotalMonths] = useState('')
  const [emiPaidMonths, setEmiPaidMonths] = useState('0')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const canSave = useMemo(() => {
    const parsedAmount = Number(amount)
    if (!name.trim() || !parsedAmount || parsedAmount <= 0) return false
    if (type === 'one_time') return true
    const day = Number(recurrenceDay)
    if (!day || day < 1 || day > 31) return false
    if (type === 'emi') {
      const total = Number(emiTotalMonths)
      const paid = Number(emiPaidMonths || '0')
      if (!total || total <= 0) return false
      if (paid < 0 || paid >= total) return false
    }
    return true
  }, [amount, emiPaidMonths, emiTotalMonths, name, recurrenceDay, type])

  const submit = async () => {
    if (!canSave) return
    const parsedAmount = Number(amount)
    setIsSaving(true)
    try {
      await createPayment({
        name: name.trim(),
        amount: toPaise(parsedAmount),
        type,
        dueDate: type === 'one_time' ? dueDate.toISOString() : undefined,
        recurrenceDay: type !== 'one_time' ? Number(recurrenceDay) : undefined,
        emiTotalMonths: type === 'emi' ? Number(emiTotalMonths) : undefined,
        emiPaidMonths: type === 'emi' ? Number(emiPaidMonths || '0') : undefined,
        note: note.trim() || undefined,
      })
      router.back()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 24) }]}>
      <Text style={styles.eyebrow}>REMINDERS</Text>
      <Text style={styles.title}>Add Payment</Text>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.typeRow}>
          {(['one_time', 'recurring', 'emi'] as const).map((item) => (
            <Pressable
              key={item}
              style={[styles.typeChip, type === item && styles.typeChipActive]}
              onPress={() => setType(item)}
            >
              <Text style={[styles.typeChipText, type === item && styles.typeChipTextActive]}>
                {item === 'one_time' ? 'One-time' : item === 'recurring' ? 'Recurring' : 'EMI'}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Payment name"
          placeholderTextColor={premiumTheme.colors.textSoft}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount in rupees"
          placeholderTextColor={premiumTheme.colors.textSoft}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {type === 'one_time' ? (
          <>
            <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateBtnText}>Due date: {dueDate.toLocaleDateString('en-IN')}</Text>
            </Pressable>
            {showDatePicker ? (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                onChange={(_, selected) => {
                  setShowDatePicker(false)
                  if (selected) setDueDate(selected)
                }}
              />
            ) : null}
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Due day of month (1-31)"
              placeholderTextColor={premiumTheme.colors.textSoft}
              keyboardType="numeric"
              value={recurrenceDay}
              onChangeText={setRecurrenceDay}
            />
            {type === 'emi' ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Total months"
                  placeholderTextColor={premiumTheme.colors.textSoft}
                  keyboardType="numeric"
                  value={emiTotalMonths}
                  onChangeText={setEmiTotalMonths}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Months already paid"
                  placeholderTextColor={premiumTheme.colors.textSoft}
                  keyboardType="numeric"
                  value={emiPaidMonths}
                  onChangeText={setEmiPaidMonths}
                />
              </>
            ) : null}
          </>
        )}

        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          placeholder="Note (optional)"
          placeholderTextColor={premiumTheme.colors.textSoft}
          multiline
          value={note}
          onChangeText={setNote}
        />

        <Pressable style={[styles.btn, (!canSave || isSaving) && styles.btnDisabled]} onPress={submit} disabled={!canSave || isSaving}>
          <Text style={styles.btnText}>{isSaving ? 'Saving...' : 'Save Payment'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premiumTheme.colors.bg,
    paddingHorizontal: 20,
  },
  eyebrow: {
    color: premiumTheme.colors.textSoft,
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    color: premiumTheme.colors.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  form: { gap: 10, paddingBottom: 24 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0A0A0B',
  },
  typeChipActive: { backgroundColor: premiumTheme.colors.text },
  typeChipText: { color: premiumTheme.colors.text, fontWeight: '600', fontSize: 12 },
  typeChipTextActive: { color: premiumTheme.colors.accentText },
  input: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    padding: 12,
    color: premiumTheme.colors.text,
    backgroundColor: '#0A0A0B',
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    borderRadius: premiumTheme.radius.md,
    padding: 12,
    backgroundColor: '#0A0A0B',
  },
  dateBtnText: { color: premiumTheme.colors.text },
  btn: {
    backgroundColor: premiumTheme.colors.accent,
    borderRadius: premiumTheme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
})
