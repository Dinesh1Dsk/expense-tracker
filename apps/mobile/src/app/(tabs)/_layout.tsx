import { Tabs } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Redirect, router } from 'expo-router'
import { useAuthStore } from '../../stores/auth.store'
import { useAccountStore } from '../../stores/account.store'
import { premiumTheme } from '../../theme/premium'

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const token = useAuthStore((s) => s.token)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const loadToken = useAuthStore((s) => s.loadToken)
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    if (!isHydrated) void loadToken()
  }, [isHydrated, loadToken])

  useEffect(() => {
    if (!isHydrated || !token || hasCheckedRef.current) return

    const run = async () => {
      hasCheckedRef.current = true
      await fetchAccounts()
      const hasAccounts = useAccountStore.getState().accounts.length > 0
      if (!hasAccounts) {
        router.replace('/onboarding/accounts')
      }
    }

    void run()
  }, [isHydrated, token, fetchAccounts])

  if (isHydrated && !token) return <Redirect href="/(auth)/login" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: premiumTheme.colors.text,
        tabBarInactiveTintColor: premiumTheme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: premiumTheme.colors.surface,
          borderTopColor: premiumTheme.colors.border,
          height: 56 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="upcoming"
        options={{
          title: 'Upcoming',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
