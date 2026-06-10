// 스튜디오 앱(iframe)과 같은 origin 의 IndexedDB 에 접근하는 셸용 헬퍼.
// iframe 의 public/studio/idb-store.js 와 동일한 DB/스토어를 공유한다.
// 로그인 복원(restore)·시드(seed)·로그아웃 정리(clear)에서 사용한다.

const DB_NAME = 'process_studio'
const STORE = 'kv'
const VERSION = 1

let dbp = null

function open() {
  if (dbp) return dbp
  dbp = new Promise((resolve) => {
    let req
    try {
      req = indexedDB.open(DB_NAME, VERSION)
    } catch (_) {
      resolve(null)
      return
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
  return dbp
}

export async function idbGet(key) {
  const db = await open()
  if (!db) return null
  return new Promise((resolve) => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    r.onsuccess = () => resolve(r.result ?? null)
    r.onerror = () => resolve(null)
  })
}

export async function idbSet(key, value) {
  const db = await open()
  if (!db) return false
  return new Promise((resolve) => {
    const r = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key)
    r.onsuccess = () => resolve(true)
    r.onerror = () => resolve(false)
  })
}

export async function idbDel(key) {
  const db = await open()
  if (!db) return
  return new Promise((resolve) => {
    const r = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key)
    r.onsuccess = () => resolve()
    r.onerror = () => resolve()
  })
}
