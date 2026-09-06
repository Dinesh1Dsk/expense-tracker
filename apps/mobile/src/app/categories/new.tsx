import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useTransactionsStore } from '../../stores/transactions.store'
import { premiumTheme } from '../../theme/premium'

const COLORS = ['#1D9E75', '#378ADD', '#BA7517', '#D85A30', '#7F77DD', '#D4537E', '#639922', '#888780']
const ICONS = ['🍽️', '🍕', '🛒', '🚗', '🚌', '✈️', '🛍️', '💊', '📚', '💡', '🏠', '🎬', '💰', '💻', '🎁', '📦']

export default function AddCategoryScreen() {
  const { meta, createCategory } = useTransactionsStore()
  const [type, setType] = useState<'expense' | 'income' | 'both'>('expense')
  const [parentId, setParentId] = useState<string | null>(null)
  const [icon, setIcon] = useState(ICONS[0])
  const [color, setColor] = useState(COLORS[0])
  const [name, setName] = useState('')

  const parentOptions = useMemo(
    () => (meta?.categories ?? []).filter((item) => !item.isSubcategory && (item.type === type || item.type === 'both')),
    [meta?.categories, type]
  )
  const parent = parentOptions.find((item) => item.id === parentId) ?? null

  const onSave = async () => {
    if (!name.trim()) return
    await createCategory({
      name: name.trim(),
      type,
      parentCategoryId: parent?.id ?? undefined,
      icon: parent ? undefined : icon,
      color: parent ? undefined : color,
    })
    router.back()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add Category</Text>

      <Text style={styles.label}>Category Type</Text>
      <View style={styles.row}>
        {(['expense', 'income', 'both'] as const).map((item) => (
          <Pressable key={item} style={[styles.chip, type === item && styles.chipActive]} onPress={() => setType(item)}>
            <Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Parent Category</Text>
      <Text style={styles.sub}>Leave empty to create a top-level category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable style={[styles.chip, !parentId && styles.chipActive]} onPress={() => setParentId(null)}>
          <Text style={[styles.chipText, !parentId && styles.chipTextActive]}>None</Text>
        </Pressable>
        {parentOptions.map((item) => (
          <Pressable key={item.id} style={[styles.chip, parentId === item.id && styles.chipActive]} onPress={() => setParentId(item.id)}>
            <Text style={[styles.chipText, parentId === item.id && styles.chipTextActive]}>{item.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Icon</Text>
      <View style={styles.grid}>
        {ICONS.map((item) => (
          <Pressable key={item} style={[styles.emoji, icon === item && styles.emojiActive, !!parent && styles.disabled]} onPress={() => !parent && setIcon(item)}>
            <Text style={styles.emojiText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Category Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Pet Care, Side Income" placeholderTextColor={premiumTheme.colors.textSoft} maxLength={30} />

      <Text style={styles.label}>Color</Text>
      <View style={styles.row}>
        {COLORS.map((item) => (
          <Pressable key={item} style={[styles.color, { backgroundColor: item }, color === item && styles.colorActive, !!parent && styles.disabled]} onPress={() => !parent && setColor(item)} />
        ))}
      </View>

      <Pressable style={[styles.btn, !name.trim() && styles.disabled]} disabled={!name.trim()} onPress={onSave}>
        <Text style={styles.btnText}>Save Category</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg },
  content: { padding: 20, gap: 8 },
  title: { color: premiumTheme.colors.text, fontSize: 28, fontWeight: '700', marginBottom: 6 },
  label: { color: premiumTheme.colors.text, fontWeight: '600', marginTop: 6 },
  sub: { color: premiumTheme.colors.textMuted, fontSize: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: premiumTheme.colors.text },
  chipText: { color: premiumTheme.colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: premiumTheme.colors.accentText },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emoji: { width: 52, height: 52, borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emojiActive: { borderColor: '#1D9E75', backgroundColor: '#173328' },
  emojiText: { fontSize: 24 },
  input: { borderWidth: 1, borderColor: premiumTheme.colors.border, borderRadius: 10, padding: 12, backgroundColor: '#0A0A0B', color: premiumTheme.colors.text },
  color: { width: 36, height: 36, borderRadius: 999 },
  colorActive: { borderWidth: 2, borderColor: '#fff' },
  btn: { marginTop: 12, backgroundColor: premiumTheme.colors.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
  btnText: { color: premiumTheme.colors.accentText, fontWeight: '700' },
  disabled: { opacity: 0.5 },
})
