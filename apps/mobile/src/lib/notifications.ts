import Constants from 'expo-constants'

const isExpoGo = Constants.appOwnership === 'expo'
let handlerSet = false

async function getNotificationsModule() {
  return import('expo-notifications')
}

async function ensureHandler() {
  if (isExpoGo || handlerSet) return
  const Notifications = await getNotificationsModule()
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  })
  handlerSet = true
}

export async function requestNotificationsPermission() {
  if (isExpoGo) return false

  const Notifications = await getNotificationsModule()
  const settings = await Notifications.getPermissionsAsync()
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true
  }
  const requested = await Notifications.requestPermissionsAsync()
  return requested.granted
}

export async function scheduleReminder(title: string, body: string, date: Date) {
  if (isExpoGo) {
    throw new Error('Notifications require a development build (Expo Go does not support this).')
  }

  await ensureHandler()
  const Notifications = await getNotificationsModule()
  const ok = await requestNotificationsPermission()
  if (!ok) throw new Error('Notification permission is required.')

  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: false },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  })
}
