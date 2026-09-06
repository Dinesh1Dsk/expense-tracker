import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { premiumTheme } from '../theme/premium'

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: Math.max(insets.top + 8, 24), paddingBottom: 32 }}
    >
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Settings</Text>
      </Pressable>
      <Text style={styles.title}>Privacy policy</Text>
      <Text style={styles.meta}>Last updated 6 September 2026 · Expense Tracker V1</Text>
      <Text style={styles.meta}>Developer: Dinesh · Package com.dineshkumar.expensetracker</Text>

      <Text style={styles.lead}>
        V1 is offline-only. Your money data stays on this device as a local JSON file. There is no
        backend, no account server, and no login or password. There is no cloud copy of your data.
      </Text>

      <Text style={styles.heading}>What stays on this device</Text>
      <Text style={styles.body}>
        You type a display name to start. That name, plus accounts, categories, transactions,
        budgets, and upcoming payments, is saved in a JSON file on the phone. A small local session
        flag remembers that you already started. It is not a password. V1 does not ask for an email
        or password.
      </Text>

      <Text style={styles.heading}>What we do not collect</Text>
      <Text style={styles.body}>
        No account is created on a server. Finance data is not uploaded to a backend we run. This
        V1 build does not include an analytics, crash-reporting, or advertising SDK. Google Play
        may still collect install and crash information under Google's own policies.
      </Text>

      <Text style={styles.heading}>Export</Text>
      <Text style={styles.body}>
        Export data in Settings is something you start. It shares a copy of the same local JSON
        file through the system share sheet. We do not upload that file. If you send it to another
        app or person, their rules apply.
      </Text>

      <Text style={styles.heading}>Erase and uninstall</Text>
      <Text style={styles.body}>
        Erase all local data wipes the JSON file and the local session on this device. Uninstalling
        the app also removes that local data. There is no cloud copy for us to delete. An export you
        already saved is yours to delete.
      </Text>

      <Text style={styles.heading}>Notifications</Text>
      <Text style={styles.body}>
        Upcoming-payment reminders are local notifications scheduled on this device. They are not
        sent through a push server we operate. You can refuse notification permission; the rest of
        the app still works.
      </Text>

      <Text style={styles.heading}>Contact</Text>
      <Text style={styles.body}>
        Use the Play Store listing for this app, or email dinesh@example.com (TODO-replace with a
        real address before you publish).
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: premiumTheme.colors.bg, paddingHorizontal: 20 },
  back: { color: premiumTheme.colors.textMuted, fontSize: 16, marginBottom: 12 },
  title: { color: premiumTheme.colors.text, fontSize: 30, fontWeight: '700', marginBottom: 6 },
  meta: { color: premiumTheme.colors.textSoft, fontSize: 13, marginBottom: 4 },
  lead: { color: premiumTheme.colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 16, marginBottom: 8 },
  heading: {
    color: premiumTheme.colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  body: { color: premiumTheme.colors.textMuted, fontSize: 15, lineHeight: 22 },
})
