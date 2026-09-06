import { Redirect } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useAuthStore } from '../stores/auth.store'
import { premiumTheme } from '../theme/premium'

export default function AppEntry() {
  const token = useAuthStore((s) => s.token)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const loadToken = useAuthStore((s) => s.loadToken)

  useEffect(() => {
    if (!isHydrated) void loadToken()
  }, [isHydrated, loadToken])

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: premiumTheme.colors.bg }}>
        <ActivityIndicator color={premiumTheme.colors.text} />
      </View>
    )
  }

  return <Redirect href={token ? '/(tabs)' : '/(auth)/login'} />
}
