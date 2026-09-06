import { useState } from 'react'
import { router } from 'expo-router'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { exportLocalDocumentJson } from '../../offline/local-data'
import { useAuthStore } from '../../stores/auth.store'
import { premiumTheme } from '../../theme/premium'

async function shareExportedJson(json: string) {
  const FileSystem = await import('expo-file-system/legacy')
  const Sharing = await import('expo-sharing')
  const stamp = new Date().toISOString().slice(0, 10)
  const filename = `expense-tracker-${stamp}.json`
  const cacheDir = FileSystem.cacheDirectory
  const docDir = FileSystem.documentDirectory
  const path = `${cacheDir ?? docDir}${filename}`
  if (!cacheDir && !docDir) {
    throw new Error('No place to save the export on this device.')
  }
  await FileSystem.writeAsStringAsync(path, json)

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Export Expense Tracker data',
    })
    return
  }

  const savedPath = `${docDir}${filename}`
  if (docDir && path !== savedPath) {
    await FileSystem.writeAsStringAsync(savedPath, json)
  }
  Alert.alert('Export saved', 'Sharing is unavailable, so the JSON file was saved on this device.')
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const eraseLocalData = useAuthStore((s) => s.eraseLocalData)
  const [busy, setBusy] = useState<'export' | 'erase' | null>(null)

  const handleExport = async () => {
    if (busy) return
    try {
      setBusy('export')
      const json = await exportLocalDocumentJson()
      await shareExportedJson(json)
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Could not export data.')
    } finally {
      setBusy(null)
    }
  }

  const runErase = async () => {
    try {
      setBusy('erase')
      await eraseLocalData()
      router.replace('/(auth)/login')
    } catch (error) {
      Alert.alert('Erase failed', error instanceof Error ? error.message : 'Could not erase local data.')
      setBusy(null)
    }
  }

  const confirmErase = () => {
    if (busy) return
    Alert.alert(
      'Erase all local data?',
      'This removes accounts, transactions, budgets, and upcoming payments from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'This cannot be undone',
              'Erase everything and return to the welcome screen?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Erase everything', style: 'destructive', onPress: () => void runErase() },
              ]
            ),
        },
      ]
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: Math.max(insets.top + 8, 24), paddingBottom: 32 }}
    >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Data stays on this device. Uninstall or erase deletes it.
      </Text>

      <Pressable style={styles.row} onPress={() => router.push('/categories')}>
        <Text style={styles.rowTitle}>Categories</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={() => router.push('/accounts')}>
        <Text style={styles.rowTitle}>Accounts</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Text style={styles.section}>ABOUT</Text>

      <Pressable style={styles.row} onPress={() => router.push('/privacy')}>
        <View>
          <Text style={styles.rowTitle}>Privacy policy</Text>
          <Text style={styles.rowHint}>How V1 stores data on this device.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Text style={styles.section}>DATA</Text>

      <Pressable
        style={styles.row}
        onPress={() => void handleExport()}
        disabled={busy !== null}
      >
        <View>
          <Text style={styles.rowTitle}>{busy === 'export' ? 'Exporting…' : 'Export data'}</Text>
          <Text style={styles.rowHint}>Share or save a JSON copy of this device.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={[styles.row, styles.dangerRow]}
        onPress={confirmErase}
        disabled={busy !== null}
      >
        <View>
          <Text style={styles.dangerTitle}>
            {busy === 'erase' ? 'Erasing…' : 'Erase all local data'}
          </Text>
          <Text style={styles.rowHint}>Requires two confirms. This is a full wipe, not a ledger edit.</Text>
        </View>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg, paddingHorizontal: 20 },
  title: { color: premiumTheme.colors.text, fontSize: 30, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: premiumTheme.colors.textMuted, marginBottom: 16 },
  section: {
    color: premiumTheme.colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 10,
  },
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
  dangerRow: { borderColor: '#3A1F1F' },
  rowTitle: { color: premiumTheme.colors.text, fontWeight: '600', fontSize: 16 },
  rowHint: { color: premiumTheme.colors.textSoft, fontSize: 13, marginTop: 4, maxWidth: 260 },
  dangerTitle: { color: '#FF6666', fontWeight: '600', fontSize: 16 },
  chevron: { color: premiumTheme.colors.textMuted, fontSize: 22, lineHeight: 22 },
})
