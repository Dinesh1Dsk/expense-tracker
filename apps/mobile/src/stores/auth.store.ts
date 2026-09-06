import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { wipeLocalDocument } from '../offline/local-data'
import { getLocalUser, initOffline, startLocalProfile } from '../offline/repo'
import { resetDataStores } from './reset'

interface AuthUser { id: string; name: string; email: string }
interface AuthState {
  token: string | null
  user: AuthUser | null
  isHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  startOffline: (name: string) => Promise<void>
  logout: () => Promise<void>
  eraseLocalData: () => Promise<void>
  loadToken: () => Promise<void>
}

const SESSION_KEY = 'offline_session'

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,
  loadToken: async () => {
    await initOffline()
    const session = await SecureStore.getItemAsync(SESSION_KEY)
    const user = getLocalUser()
    if (session && user) {
      set({ token: user.id, user, isHydrated: true })
      return
    }
    set({ token: null, user: null, isHydrated: true })
  },
  startOffline: async (name) => {
    const user = await startLocalProfile(name)
    await SecureStore.setItemAsync(SESSION_KEY, user.id)
    set({ token: user.id, user })
  },
  login: async (_email, _password) => {
    await initOffline()
    const user = getLocalUser()
    if (!user) throw new Error('No local profile yet. Enter your name to start.')
    await SecureStore.setItemAsync(SESSION_KEY, user.id)
    set({ token: user.id, user })
  },
  register: async (name) => {
    await initOffline()
    const user = await startLocalProfile(name)
    await SecureStore.setItemAsync(SESSION_KEY, user.id)
    set({ token: user.id, user })
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY)
    set({ token: null, user: null, isHydrated: true })
  },
  eraseLocalData: async () => {
    await wipeLocalDocument()
    await SecureStore.deleteItemAsync(SESSION_KEY)
    set({ token: null, user: null, isHydrated: true })
    resetDataStores()
  },
}))
