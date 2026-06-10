import { supabase } from './supabase'
import { idbGet, idbSet, idbDel } from './idb'

// 작전판 / 일정 / 게임모델 저장·조회 헬퍼 (RLS로 본인 데이터만 접근)

export async function listBoards(kind) {
  let query = supabase
    .from('boards')
    .select('*')
    .order('updated_at', { ascending: false })
  if (kind) query = query.eq('kind', kind)
  return query // { data, error }
}

export async function getBoard(id) {
  return supabase.from('boards').select('*').eq('id', id).single()
}

export async function saveBoard({ id, kind = 'board', title, data, thumbnail }) {
  const { data: userData } = await supabase.auth.getUser()
  const user_id = userData?.user?.id
  if (!user_id) return { data: null, error: new Error('로그인이 필요합니다.') }

  const payload = { user_id, kind, title, data, thumbnail }
  if (id) {
    return supabase.from('boards').update(payload).eq('id', id).select().single()
  }
  return supabase.from('boards').insert(payload).select().single()
}

export async function deleteBoard(id) {
  return supabase.from('boards').delete().eq('id', id)
}

// ════════════════════════════════════════════════════════════
//  A. 항목별 저장/불러오기 (배치 play · 세션 session · 내 구성 template)
//     각 항목 = boards 한 행. title = 항목 이름, data = 항목 내용.
//     (user_id, kind, title) 유니크라 같은 이름이면 덮어쓴다.
//     불러오기 목록은 Supabase 에서 직접 조회한다.
// ════════════════════════════════════════════════════════════

// 종류별 항목 목록 (RLS 로 본인 행만)
// 기본은 가벼운 메타(title, updated_at)만 — 드롭다운 채우는 데 data 까지
// 통째로 내려받지 않도록. 실제 data 는 선택 시 dbGet 으로 지연 로드한다.
// withData=true 면 data 포함(작은 항목: 내 구성 등).
export async function dbList(kind, { withData = false } = {}) {
  const cols = withData ? 'title,data,updated_at' : 'title,updated_at'
  return supabase
    .from('boards')
    .select(cols)
    .eq('kind', kind)
    .order('updated_at', { ascending: false })
}

// 단일 항목 조회
export async function dbGet(kind, title) {
  return supabase
    .from('boards')
    .select('data')
    .eq('kind', kind)
    .eq('title', title)
    .maybeSingle()
}

// 항목 저장 (이름 기준 upsert)
export async function dbUpsert(kind, title, data) {
  const { data: userData } = await supabase.auth.getUser()
  const user_id = userData?.user?.id
  if (!user_id) return { data: null, error: new Error('로그인이 필요합니다.') }
  return supabase
    .from('boards')
    .upsert({ user_id, kind, title, data }, { onConflict: 'user_id,kind,title' })
    .select()
    .single()
}

// 항목 삭제
export async function dbDelete(kind, title) {
  return supabase.from('boards').delete().eq('kind', kind).eq('title', title)
}

// ════════════════════════════════════════════════════════════
//  B. 단일 상태 동기화 (매치노트 · 경기정보 · 훈련일정 작업본)
//     명시적 "불러오기 목록"이 없는 작업 상태. 사용자당 kind 1행을
//     고정 title 로 유지하고, 로그인 시 자동 복원한다. 셸·앱이 같은
//     출처라 localStorage 를 공유하므로 키를 통째로 직렬화한다.
// ════════════════════════════════════════════════════════════
const STATE_KEY = {
  matchnotes: 'cs_matchnotes', // 작전판: 매치노트
  match: 'cs_match_v1', // 작전판: 경기 정보
  schedule: 'process_coach_v1', // 일정: 훈련 일정 작업본(weeks·dday 등)
  gamemodel: 'cs_gamemodel_v1', // 게임모델: 4국면 플레이 원칙 문서
}
const STATE_TITLE = '_state' // 단일 상태 행의 고정 title

// 클라우드 상태를 로컬 작업 버퍼(IndexedDB)에 기록 → 앱이 새로고침 시 읽는다.
export async function restoreStateKind(kind, data = {}) {
  const k = STATE_KEY[kind]
  if (!k || data[k] == null) return false
  const ok = await idbSet(k, data[k])
  if (ok) return true
  // IDB 불가 시 localStorage 폴백
  try {
    localStorage.setItem(k, data[k])
    return true
  } catch (_) {
    return false
  }
}

// 단일 상태를 클라우드에 upsert.
// payload(앱이 메모리에서 직렬화해 보낸 JSON 문자열)가 있으면 그대로 저장 →
// localStorage/IDB 가 꽉 차 있어도 클라우드 저장은 보장된다.
// payload 가 없으면(첫 로그인 시드 등) 로컬 버퍼에서 읽어 올린다.
export async function saveStateKind(kind, payload) {
  const k = STATE_KEY[kind]
  if (!k) return { error: new Error('unknown kind') }
  const { data: userData } = await supabase.auth.getUser()
  const user_id = userData?.user?.id
  if (!user_id) return { data: null, error: new Error('로그인이 필요합니다.') }
  let data = {}
  let v = payload
  if (v == null) {
    try {
      v = await idbGet(k)
    } catch (_) {}
    if (v == null) {
      try {
        v = localStorage.getItem(k)
      } catch (_) {}
    }
  }
  if (v != null) data[k] = v
  return supabase
    .from('boards')
    .upsert(
      { user_id, kind, title: STATE_TITLE, data },
      { onConflict: 'user_id,kind,title' }
    )
    .select()
    .single()
}

// 로그아웃 시 로컬 작업 버퍼(IDB + localStorage)에서 주어진 키들을 비운다.
export async function clearLocalKeys(keys = []) {
  await Promise.all(
    keys.map((k) =>
      idbDel(k)
        .catch(() => {})
        .then(() => {
          try {
            localStorage.removeItem(k)
          } catch (_) {}
        })
    )
  )
}

// 클라우드의 단일 상태 조회
export async function loadStateKind(kind) {
  return supabase
    .from('boards')
    .select('data')
    .eq('kind', kind)
    .eq('title', STATE_TITLE)
    .maybeSingle()
}
