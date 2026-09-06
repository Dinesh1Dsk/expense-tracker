import { createId } from './ids'
import { readDocument, writeDocument } from './persist'
import { SYSTEM_CATEGORIES } from './seed'
import { emptyDocument, type OfflineDocument } from './types'

let cache: OfflineDocument | null = null
let hydratePromise: Promise<OfflineDocument> | null = null

function seedCategories(doc: OfflineDocument): OfflineDocument {
  const existingByName = new Map(doc.categories.filter((row) => row.isSystem).map((row) => [row.name.toLowerCase(), row]))
  let changed = false

  for (const item of SYSTEM_CATEGORIES) {
    const current = existingByName.get(item.name.toLowerCase())
    if (!current) {
      doc.categories.push({
        id: createId(),
        userId: null,
        name: item.name,
        icon: item.icon,
        color: '#1D9E75',
        type: item.type,
        parentCategoryId: null,
        isSystem: true,
        sortOrder: doc.categories.length,
      })
      changed = true
      continue
    }
    if (current.type !== item.type) {
      current.type = item.type
      changed = true
    }
  }

  return changed ? { ...doc, categories: [...doc.categories] } : doc
}

export async function hydrateOfflineDb(): Promise<OfflineDocument> {
  if (cache) return cache
  if (!hydratePromise) {
    hydratePromise = (async () => {
      const loaded = seedCategories(await readDocument())
      cache = loaded
      await writeDocument(loaded)
      return loaded
    })()
  }
  return hydratePromise
}

export function getDocument(): OfflineDocument {
  if (!cache) throw new Error('Offline database is not ready.')
  return cache
}

export async function mutateDocument(mutator: (doc: OfflineDocument) => void): Promise<OfflineDocument> {
  const doc = await hydrateOfflineDb()
  mutator(doc)
  cache = doc
  await writeDocument(doc)
  return doc
}

export async function resetOfflineDb(): Promise<void> {
  cache = null
  hydratePromise = null
  await writeDocument(emptyDocument())
}

export function resetOfflineDbCache() {
  cache = null
  hydratePromise = null
}
