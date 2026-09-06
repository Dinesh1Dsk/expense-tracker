import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { premiumTheme } from '../../theme/premium'

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 24) }]}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage app configuration and master data.</Text>

      <Pressable style={styles.row} onPress={() => router.push('/categories')}>
        <Text style={styles.rowTitle}>Categories</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={() => router.push('/accounts')}>
        <Text style={styles.rowTitle}>Accounts</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg, padding: 20 },
  title: { color: premiumTheme.colors.text, fontSize: 30, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: premiumTheme.colors.textMuted, marginBottom: 16 },
  row: {
    backgroundColor: premiumTheme.colors.surface,
    borderColor: premiumTheme.colors.border,
    borderWidth: 1,
    borderRadius: premiumTheme.radius.lg,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: { color: premiumTheme.colors.text, fontWeight: '600', fontSize: 16 },
  chevron: { color: premiumTheme.colors.textMuted, fontSize: 22, lineHeight: 22 },
})
