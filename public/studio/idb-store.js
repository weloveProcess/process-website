/* ============================================================
   idb-store.js — 스튜디오 앱(board/process/gamemodel)의 로컬 작업
   버퍼를 IndexedDB 로 제공하는 어댑터.

   localStorage 는 origin 당 ~5MB 라 배치·세션·SVG 썸네일이 쌓이면
   QuotaExceededError 로 저장이 조용히 실패한다. IndexedDB 는 한도가
   수백 MB~GB 라 이 문제를 제거한다.

   계약 (board.html 의 store 추상화와 동일):
     await window.storage.get(key)    -> { value:<string> } | null
     await window.storage.set(key, stringValue) -> void
     await window.storage.remove(key) -> void
     await window.storage.clear(keys?) -> void   // keys 없으면 전체
     window.storage.ready             -> Promise   // 초기화 완료
   값은 항상 문자열(이미 JSON.stringify 된)로 저장/반환한다.

   최초 로드시 기존 localStorage 의 스튜디오 키를 IDB 로 1회 이관하고
   localStorage 에서 제거해 용량을 회수한다. UI 환경설정 키는 둔다.
   ============================================================ */
(function () {
  var DB_NAME = 'process_studio'
  var STORE = 'kv'
  var VERSION = 1

  // IDB 로 옮길 스튜디오 작업 데이터 키 (UI 환경설정 cs_devmode·cs_onboard_v1 은 제외)
  var MIGRATE_KEYS = [
    'tactics_plays_v1',
    'training_sessions_v1',
    'training_session_cur_v1',
    'cs_matchnotes',
    'cs_match_v1',
    'process_coach_v1',
    'cs_gamemodel_v1',
    'cs_onboard_v1',
  ]

  var mem = {} // IDB 사용 불가 시 최후 폴백(세션 한정)
  var dbp = null

  function openDB() {
    return new Promise(function (resolve, reject) {
      var req
      try {
        req = indexedDB.open(DB_NAME, VERSION)
      } catch (e) {
        reject(e)
        return
      }
      req.onupgradeneeded = function () {
        var db = req.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      }
      req.onsuccess = function () {
        resolve(req.result)
      }
      req.onerror = function () {
        reject(req.error)
      }
    })
  }

  function tx(db, mode) {
    return db.transaction(STORE, mode).objectStore(STORE)
  }

  function idbGet(db, key) {
    return new Promise(function (resolve, reject) {
      var r = tx(db, 'readonly').get(key)
      r.onsuccess = function () {
        resolve(r.result)
      }
      r.onerror = function () {
        reject(r.error)
      }
    })
  }

  function idbSet(db, key, value) {
    return new Promise(function (resolve, reject) {
      var r = tx(db, 'readwrite').put(value, key)
      r.onsuccess = function () {
        resolve()
      }
      r.onerror = function () {
        reject(r.error)
      }
    })
  }

  function idbDel(db, key) {
    return new Promise(function (resolve, reject) {
      var r = tx(db, 'readwrite').delete(key)
      r.onsuccess = function () {
        resolve()
      }
      r.onerror = function () {
        reject(r.error)
      }
    })
  }

  // 최초 1회: localStorage → IDB 이관 후 localStorage 에서 제거(용량 회수)
  function migrate(db) {
    var jobs = []
    MIGRATE_KEYS.forEach(function (k) {
      var v
      try {
        v = localStorage.getItem(k)
      } catch (_) {
        v = null
      }
      if (v == null) return
      jobs.push(
        idbGet(db, k).then(function (existing) {
          // 이미 IDB 에 있으면 덮어쓰지 않음(IDB 가 최신)
          if (existing != null) {
            try {
              localStorage.removeItem(k)
            } catch (_) {}
            return
          }
          return idbSet(db, k, v).then(function () {
            try {
              localStorage.removeItem(k)
            } catch (_) {}
          })
        })
      )
    })
    return Promise.all(jobs).catch(function () {})
  }

  var ready = openDB()
    .then(function (db) {
      dbp = db
      return migrate(db).then(function () {
        return db
      })
    })
    .catch(function () {
      dbp = null // IDB 불가 → mem 폴백
      return null
    })

  window.storage = {
    ready: ready,
    get: function (key) {
      return ready.then(function (db) {
        if (!db) return key in mem ? { value: mem[key] } : null
        return idbGet(db, key).then(function (v) {
          return v == null ? null : { value: v }
        })
      })
    },
    set: function (key, value) {
      return ready.then(function (db) {
        if (!db) {
          mem[key] = value
          return
        }
        return idbSet(db, key, value).catch(function (e) {
          mem[key] = value // IDB 쓰기 실패 시 메모리 보존
          throw e
        })
      })
    },
    remove: function (key) {
      return ready.then(function (db) {
        delete mem[key]
        if (!db) return
        return idbDel(db, key)
      })
    },
    // keys 배열을 주면 해당 키만, 없으면 전체 비우기(로그아웃 정리)
    clear: function (keys) {
      return ready.then(function (db) {
        var list = keys && keys.length ? keys : MIGRATE_KEYS
        list.forEach(function (k) {
          delete mem[k]
        })
        if (!db) return
        return Promise.all(
          list.map(function (k) {
            return idbDel(db, k).catch(function () {})
          })
        )
      })
    },
  }
})()
