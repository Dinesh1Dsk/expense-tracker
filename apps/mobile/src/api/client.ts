/** V1 is offline-only. Stores use `src/offline/repo.ts`. Keep this file for a later sync backend. */
export async function apiRequest<T>(_path: string, _options: RequestInit = {}): Promise<T> {
  throw new Error('Offline v1 does not call the API.')
}
