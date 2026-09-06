import { StyleSheet, Text, View } from 'react-native'
import { premiumTheme } from '../theme/premium'

interface PremiumPlaceholderScreenProps {
  title: string
  subtitle: string
}

export function PremiumPlaceholderScreen({ title, subtitle }: PremiumPlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>PREMIUM</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premiumTheme.colors.bg,
    paddingHorizontal: 20,
    paddingTop: 36,
  },
  eyebrow: {
    color: premiumTheme.colors.textSoft,
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },
  title: {
    color: premiumTheme.colors.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: 18,
  },
  card: {
    backgroundColor: premiumTheme.colors.surface,
    borderRadius: premiumTheme.radius.lg,
    borderWidth: 1,
    borderColor: premiumTheme.colors.border,
    padding: 18,
  },
  subtitle: {
    color: premiumTheme.colors.textMuted,
    lineHeight: 22,
    fontSize: 15,
  },
})
