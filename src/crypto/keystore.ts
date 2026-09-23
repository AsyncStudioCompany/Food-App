/**
 * Keeps CryptoKeys in IndexedDB. Keys are stored non-extractable: the page can use them,
 * but nothing (not even this code) can read their bytes back.
 */
const DB = 'mijote'
const STORE = 'keys'

export const keystoreAvailable = () => typeof indexedDB !== 'undefined' && typeof crypto?.subtle !== 'undefined'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result as T)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export const getKey = (name: string) => run<CryptoKey | undefined>('readonly', (s) => s.get(name))
export const setKey = (name: string, key: CryptoKey) => run<void>('readwrite', (s) => s.put(key, name))
export const deleteKey = (name: string) => run<void>('readwrite', (s) => s.delete(name))
