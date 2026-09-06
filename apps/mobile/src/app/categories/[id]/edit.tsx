import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useTransactionsStore } from '../../../stores/transactions.store'
import { premiumTheme } from '../../../theme/premium'

const COLORS = ['#1D9E75', '#378ADD', '#BA7517', '#D85A30', '#7F77DD', '#D4537E', '#639922', '#888780']
const ICONS = ['🍽️', '🍕', '🛒', '🚗', '🚌', '✈️', '🛍️', '💊', '📚', '💡', '🏠', '🎬', '💰', '💻', '🎁', '📦']

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { meta, updateCategory } = useTransactionsStore()
  const category = useMemo(() => (meta?.categories ?? []).find((item) => item.id === id), [meta?.categories, id])

  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? ICONS[0])
  const [color, setColor] = useState(category?.color ?? COLORS[0])

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Category not found</Text>
      </View>
    )
  }

  const isSub = !!category.parentCategoryId

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Please enter a category name')
      return
    }
    await updateCategory(category.id, {
      name: name.trim(),
      icon: isSub ? undefined : icon,
      color: isSub ? undefined : color,
    })
    router.back()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit Category</Text>
      <Text style={styles.note}>Category type and parent cannot be changed.</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={30} />

      <Text style={styles.label}>Icon</Text>
      <View style={styles.grid}>
        {ICONS.map((item) => (
          <Pressable key={item} style={[styles.emoji, icon === item && styles.emojiActive, isSub && styles.disabled]} onPress={() => !isSub && setIcon(item)}>
            <Text style={styles.emojiText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Color</Text>
      <View style={styles.row}>
        {COLORS.map((item) => (
          <Pressable key={item} style={[styles.color, { backgroundColor: item }, color === item && styles.colorActive, isSub && styles.disabled]} onPress={() => !isSub && setColor(item)} />
        ))}
      </View>

      <Pressable style={styles.btn} onPress={onSave}>
        <Text style={styles.btnText}>Save Changes</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg },
  content: { padding: 20, gap: 10 },
  title: { color: premiumTheme.colors.text, fontSize: 28, fontWeight: '700' },
  note: { color: premiumTheme.colors.textMuted },
  input: { borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 10, padding: 12, backgroundColor: '#0A0A0B', color: premiumTheme.colors.text },
  label: { color: premiumTheme.colors.text, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emoji: { width: 52, height: 52, borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emojiActive: { borderColor: '#1D9E75', backgroundColor: '#173328' },
  emojiText: { fontSize: 24 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  color: { width: 36, height: 36, borderRadius: 999 },
  colorActive: { borderWidth: 2, borderColor: '#fff' },
  btn: { marginTop: 12, backgroundColor: premiumTheme.colors.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
  btnText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
  disabled: { opacity: 0.4 },
})
