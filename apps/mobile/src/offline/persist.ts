import { emptyDocument, type OfflineDocument } from './types'

export interface PersistAdapter {
  read(): Promise<string | null>
  write(value: string): Promise<void>
}

const memory = { value: null as string | null }

export const memoryPersist: PersistAdapter = {
  async read() {
    return memory.value
  },
  async write(value) {
    memory.value = value
  },
}

export function resetMemoryPersist() {
  memory.value = null
}

async function filePersist(): Promise<PersistAdapter> {
  try {
    const FileSystem = await import('expo-file-system/legacy')
    const dir = FileSystem.documentDirectory
    if (!dir) return memoryPersist
    const path = `${dir}expense-tracker-v1.json`
    return {
      async read() {
        const info = await FileSystem.getInfoAsync(path)
        if (!info.exists) return null
        return FileSystem.readAsStringAsync(path)
      },
      async write(value) {
        await FileSystem.writeAsStringAsync(path, value)
      },
    }
  } catch {
    return memoryPersist
  }
}

let adapterPromise: Promise<PersistAdapter> | null = null
let override: PersistAdapter | null = null

export function setPersistAdapter(adapter: PersistAdapter | null) {
  override = adapter
  adapterPromise = null
}

export async function getPersistAdapter(): Promise<PersistAdapter> {
  if (override) return override
  if (!adapterPromise) adapterPromise = filePersist()
  return adapterPromise
}

export async function readDocument(): Promise<OfflineDocument> {
  const adapter = await getPersistAdapter()
  const raw = await adapter.read()
  if (!raw) return emptyDocument()
  try {
    const parsed = JSON.parse(raw) as OfflineDocument
    if (parsed?.version !== 1) return emptyDocument()
    return {
      ...emptyDocument(),
      ...parsed,
      accounts: parsed.accounts ?? [],
      categories: parsed.categories ?? [],
      transactions: parsed.transactions ?? [],
      budgets: parsed.budgets ?? [],
      upcoming: parsed.upcoming ?? [],
    }
  } catch {
    return emptyDocument()
  }
}

export async function writeDocument(doc: OfflineDocument): Promise<void> {
  const adapter = await getPersistAdapter()
  await adapter.write(JSON.stringify(doc))
}
