import * as SecureStore from 'expo-secure-store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('auth_token')
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Network error. Check API URL, server status, and Wi-Fi connection.')
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    let message = ''
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { error?: string; message?: string }
        message = parsed.error ?? parsed.message ?? ''
      } catch {
        message = raw.trim()
      }
    }
    if (!message) message = `Request failed (${res.status})`
    throw new Error(message)
  }

  return res.json()
}
