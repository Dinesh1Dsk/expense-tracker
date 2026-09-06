import { getDocument, hydrateOfflineDb, resetOfflineDb } from './db'

export async function exportLocalDocumentJson(): Promise<string> {
  await hydrateOfflineDb()
  return JSON.stringify(getDocument(), null, 2)
}

export async function wipeLocalDocument(): Promise<void> {
  await resetOfflineDb()
}
