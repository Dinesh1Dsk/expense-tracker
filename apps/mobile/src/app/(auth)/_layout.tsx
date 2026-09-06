import { Stack } from 'expo-router'
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useEffect } from 'react'
import { useAuthStore } from '../../stores/auth.store'
import { premiumTheme } from '../../theme/premium'
export default function AuthLayout() {
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

  if (token) return <Redirect href="/(tabs)" />
  return <Stack screenOptions={{ headerShown: false }} />
}
