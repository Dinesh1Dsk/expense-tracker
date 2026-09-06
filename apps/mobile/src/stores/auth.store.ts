import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { apiRequest } from '../api/client'

interface AuthUser { id: string; name: string; email: string }
interface AuthState {
  token: string | null
  user: AuthUser | null
  isHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,
  loadToken: async () => {
    const token = await SecureStore.getItemAsync('auth_token')
    set({ token: token ?? null, isHydrated: true })
  },
  login: async (email, password) => {
    const res = await apiRequest<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    await SecureStore.setItemAsync('auth_token', res.token)
    set({ token: res.token, user: res.user })
  },
  register: async (name, email, password) => {
    const res = await apiRequest<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    await SecureStore.setItemAsync('auth_token', res.token)
    set({ token: res.token, user: res.user })
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token')
    set({ token: null, user: null, isHydrated: true })
  },
}))
