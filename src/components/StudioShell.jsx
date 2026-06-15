import { useEffect, useRef, useState } from 'react'
import AuthBar from './AuthBar'
import { useAuth } from '../context/AuthContext'
import {
  dbList,
  dbGet,
  dbUpsert,
  dbDelete,
  saveStateKind,
  loadStateKind,
  restoreStateKind,
  clearLocalKeys,
} from '../lib/boards'

const STATE_KINDS = ['matchnotes', 'match', 'schedule', 'gamemodel', 'note', 'scout']

// 로그아웃 시 비우는 스튜디오 작업 데이터(다음 사용자에게 새지 않도록).
// UI 환경설정(cs_devmode·cs_onboard_v1)은 유지한다.
const STUDIO_LOCAL_KEYS = [
  'tactics_plays_v1',
  'training_sessions_v1',
  'training_session_cur_v1',
  'cs_matchnotes',
  'cs_match_v1',
  'process_coach_v1',
  'cs_gamemodel_v1',
  'cs_notes_v1',
  'scout_tool_v1',
  'cs_squad_v1',
  'cs_tokshape',
]
async function clearStudioLocal() {
  for (const k of STUDIO_LOCAL_KEYS) {
    try {
      localStorage.removeItem(k)
    } catch (_) {}
  }
  try {
    await clearLocalKeys(STUDIO_LOCAL_KEYS)
  } catch (_) {}
}

const APPS = [
  { id: 'board', label: '보드' },
  { id: 'design', label: '훈련 디자인' }, // 보드의 session 뷰 재사용
  { id: 'process', label: '일정' },
  { id: 'scout', label: '팀' },
  { id: 'note', label: '노트' },
  { id: 'gamemodel', label: '게임모델' },
]

const HINTS = {
  board: '전술·세션을 그리고, 애니메이션·영상으로 내보내세요',
  design: '작전판에 그림을 그려 드릴을 만들고, 훈련 세션을 설계하세요',
  process: '경기일(MD) 기준 자동 주기화 · 훈련 블록에서 작전판 첨부 가능',
  scout: '선수 명단·평가·포지션 타깃을 한 곳에서 관리하세요',
  note: '훈련·경기 노트를 자유롭게 기록하고 정리하세요',
  gamemodel: '4국면별 우리 팀의 플레이 원칙을 정리하고 문서로 내보내세요',
}

// design 은 board iframe(session 뷰)을 재사용하므로 별도 src 없음
const SRC = {
  board: '/studio/board.html',
  process: '/studio/process.html',
  scout: '/studio/scout.html',
  note: '/studio/note.html',
  gamemodel: '/studio/gamemodel.html',
}
// 어떤 앱 탭이 어떤 iframe 을 보여주는가 (design→board)
const FRAME_OF = {
  board: 'board',
  design: 'board',
  process: 'process',
  scout: 'scout',
  note: 'note',
  gamemodel: 'gamemodel',
}

export default function StudioShell() {
  const { user } = useAuth()
  const [app, setApp] = useState('board') // 'board' | 'process' | 'gamemodel'
  const [dev, setDev] = useState('auto') // 'auto' | 'phone'
  const [focus, setFocus] = useState(false)
  const boardRef = useRef(null)
  const processRef = useRef(null)
  const gamemodelRef = useRef(null)
  const scoutRef = useRef(null)
  const noteRef = useRef(null)
  const [boardLoaded, setBoardLoaded] = useState(false)
  // 클라우드 자동저장 상태 표시: null | 'saving' | 'saved' | 'error' | 'offline'
  const [saveStatus, setSaveStatus] = useState(null)
  const savedClearTimer = useRef(null)
  // 아직 클라우드에 못 올린(오프라인·실패) 종류들 → 온라인 복귀 시 flush
  const pendingKinds = useRef(new Set())
  function flashStatus(status, hold = 1800) {
    setSaveStatus(status)
    clearTimeout(savedClearTimer.current)
    savedClearTimer.current = setTimeout(() => setSaveStatus(null), hold)
  }
  function isOffline() {
    return typeof navigator !== 'undefined' && navigator.onLine === false
  }
  // 온라인 복귀 시 보류된 변경을 클라우드로 한꺼번에 동기화
  function flushPending() {
    if (!userRef.current || isOffline()) return
    const kinds = Array.from(pendingKinds.current)
    if (!kinds.length) return
    setSaveStatus('saving')
    Promise.all(
      kinds.map((kind) =>
        saveStateKind(kind, lastPayload.current[kind])
          .then((res) => {
            if (!(res && res.error)) pendingKinds.current.delete(kind)
          })
          .catch(() => {})
      )
    ).then(() => flashStatus(pendingKinds.current.size === 0 ? 'saved' : 'error'))
  }

  // 메시지 핸들러가 항상 최신 로그인 상태를 보도록 ref 로 보관
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])
  // 온라인 복귀 시 보류된 변경 자동 동기화
  useEffect(() => {
    const onOnline = () => flushPending()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // 앱 저장 신호를 종류별로 디바운스(autosave 폭주 방지)
  const saveTimers = useRef({})
  // 각 종류의 최신 payload(앱이 메모리에서 직렬화해 보낸 상태)
  const lastPayload = useRef({})
  // 보드에 캡처를 요청한 앱(process | gamemodel)
  const captureReqRef = useRef('process')

  // iframe 들을 새 데이터로 재로딩
  function reloadFrames() {
    setBoardLoaded(false)
    if (boardRef.current) boardRef.current.src = SRC.board
    if (processRef.current) processRef.current.src = SRC.process
    if (gamemodelRef.current) gamemodelRef.current.src = SRC.gamemodel
    if (scoutRef.current) scoutRef.current.src = SRC.scout
    if (noteRef.current) noteRef.current.src = SRC.note
  }

  // 로그인 상태를 앱(iframe)들에 알림 → 앱이 Supabase 사용 여부 결정
  function broadcastAuth(win) {
    const enabled = !!userRef.current
    const targets = win
      ? [win]
      : [
          boardRef.current?.contentWindow,
          processRef.current?.contentWindow,
          gamemodelRef.current?.contentWindow,
          scoutRef.current?.contentWindow,
          noteRef.current?.contentWindow,
        ]
    for (const w of targets) {
      try {
        w?.postMessage({ type: 'dbAuth', enabled }, '*')
      } catch (_) {}
    }
  }

  // 앱의 DB 요청(StudioDB) 처리 → boards.js 경유 Supabase, 결과를 앱으로 회신
  async function handleDbRequest(d, source) {
    const reply = { type: 'dbResult', reqId: d.reqId, ok: false }
    if (!userRef.current) {
      reply.offline = true
      try {
        source?.postMessage(reply, '*')
      } catch (_) {}
      return
    }
    try {
      if (d.op === 'list') {
        const { data, error } = await dbList(d.kind, { withData: !!d.withData })
        reply.ok = !error
        reply.rows = data || []
        if (error) reply.error = error.message
      } else if (d.op === 'get') {
        const { data, error } = await dbGet(d.kind, d.title)
        reply.ok = !error
        reply.data = data?.data
        if (error) reply.error = error.message
      } else if (d.op === 'upsert') {
        const { error } = await dbUpsert(d.kind, d.title, d.data)
        reply.ok = !error
        if (error) reply.error = error.message
      } else if (d.op === 'delete') {
        const { error } = await dbDelete(d.kind, d.title)
        reply.ok = !error
        if (error) reply.error = error.message
      }
    } catch (e) {
      reply.error = String(e)
    }
    try {
      source?.postMessage(reply, '*')
    } catch (_) {}
  }

  // 디바이스 미리보기 모드 복원
  useEffect(() => {
    try {
      setDev(localStorage.getItem('cs_devmode') || 'auto')
    } catch (_) {}
  }, [])

  function changeDev(mode) {
    setDev(mode)
    try {
      localStorage.setItem('cs_devmode', mode)
    } catch (_) {}
  }

  // 앱 사이 브리지 릴레이 (보드 ↔ 일정 ↔ 게임모델)
  useEffect(() => {
    function onMessage(e) {
      const d = e.data || {}
      const board = boardRef.current?.contentWindow
      const proc = processRef.current?.contentWindow
      const gm = gamemodelRef.current?.contentWindow
      if (
        (d.source === 'process' || d.source === 'gamemodel') &&
        d.type === 'openBoard'
      ) {
        captureReqRef.current = d.source
        setApp('board')
        try {
          board?.postMessage({ type: 'enterCapture', snap: d.snap }, '*')
        } catch (_) {}
      } else if (d.source === 'board' && d.type === 'capture') {
        const reqr = captureReqRef.current
        const tgt = reqr === 'gamemodel' ? gm : proc
        try {
          tgt?.postMessage(
            { type: 'boardResult', thumb: d.thumb, snap: d.snap },
            '*'
          )
        } catch (_) {}
        setApp(reqr)
      } else if (d.source === 'board' && d.type === 'captureCancel') {
        const reqr = captureReqRef.current
        if (reqr === 'gamemodel') {
          try {
            gm?.postMessage({ type: 'boardCancel' }, '*')
          } catch (_) {}
        }
        setApp(reqr)
      } else if (d.source === 'board' && d.type === 'sendToWeek') {
        setApp('process')
        try {
          proc?.postMessage({ type: 'importSession', session: d.session }, '*')
        } catch (_) {}
      } else if (d.source === 'board' && d.type === 'sendToWeekAuto') {
        // 화면 전환 없이 일정에 자동 반영 (process 로드 타이밍 대비 2회 재전송)
        const postAuto = (n) => {
          try {
            proc?.postMessage(
              {
                type: 'importSessionAuto',
                session: d.session,
                date: d.date,
                linkId: d.linkId,
              },
              '*'
            )
          } catch (_) {}
          if (n > 0) setTimeout(() => postAuto(n - 1), 900)
        }
        postAuto(2)
      } else if (d.source === 'scout' && d.type === 'openGameModel') {
        setApp('gamemodel')
      } else if (d.source === 'gamemodel' && d.type === 'backToTeam') {
        setApp('scout')
      } else if (d.source === 'gamemodel' && d.type === 'openTeamView') {
        setApp('scout')
        try {
          scoutRef.current?.contentWindow?.postMessage(
            { type: 'setView', view: d.view },
            '*'
          )
        } catch (_) {}
      } else if (d.source === 'board' && d.type === 'focusBoard') {
        setFocus(!!d.on)
      } else if (d.type === 'db') {
        // 항목별 저장/불러오기(배치·세션·내 구성) RPC
        handleDbRequest(d, e.source)
      } else if (d.type === 'cloudSave' && STATE_KINDS.includes(d.kind)) {
        // 단일 상태(매치노트·경기정보·일정·게임모델) → 디바운스 후 Supabase upsert.
        // payload(메모리 직렬화 상태)를 직접 올려 localStorage/IDB 용량과 무관하게 저장.
        if (!userRef.current) return
        const kind = d.kind
        if (typeof d.payload === 'string') lastPayload.current[kind] = d.payload
        pendingKinds.current.add(kind)
        // 오프라인이면 네트워크 시도 없이 로컬 저장만 알리고 보류 → 온라인 복귀 시 flush
        if (isOffline()) {
          clearTimeout(saveTimers.current[kind])
          flashStatus('offline')
          return
        }
        setSaveStatus('saving')
        clearTimeout(saveTimers.current[kind])
        saveTimers.current[kind] = setTimeout(() => {
          const payload = lastPayload.current[kind]
          saveStateKind(kind, payload)
            .then((res) => {
              const ok = !(res && res.error)
              if (ok) pendingKinds.current.delete(kind)
              flashStatus(ok ? 'saved' : 'error')
            })
            .catch(() => flashStatus('error'))
        }, 2500)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // 로그인 상태가 바뀌면 앱들에 알림 + 로그아웃 전환이면 로컬 정리
  const prevUserIdRef = useRef(user?.id ?? null)
  useEffect(() => {
    const prev = prevUserIdRef.current
    const cur = user?.id ?? null
    prevUserIdRef.current = cur
    broadcastAuth()
    if (prev && !cur) {
      // 실제 로그아웃: 이전 사용자 데이터를 비우고(IDB+localStorage) 빈 상태로 새로고침
      clearStudioLocal().finally(() => reloadFrames())
    }
  }, [user])

  // 로그인하면 단일 상태를 동기화: 클라우드에 있으면 로컬로 복원,
  // 없으면(첫 로그인) 로컬을 클라우드에 seed. 항목별 데이터(배치/세션/구성)는
  // 앱이 로그인 신호를 받아 목록을 새로고침한다.
  const restoredRef = useRef(false)
  useEffect(() => {
    if (!user) {
      restoredRef.current = false
      return
    }
    if (restoredRef.current) return
    restoredRef.current = true
    ;(async () => {
      let wrote = false
      for (const kind of STATE_KINDS) {
        try {
          const { data } = await loadStateKind(kind)
          if (data?.data && Object.keys(data.data).length) {
            if (await restoreStateKind(kind, data.data)) wrote = true
          } else {
            await saveStateKind(kind).catch(() => {})
          }
        } catch (_) {}
      }
      if (wrote) reloadFrames()
    })()
  }, [user])

  // 보드/디자인 탭 전환 시 보드 내부 뷰 지정 (design = session 뷰)
  useEffect(() => {
    if (app === 'board' || app === 'design') {
      try {
        boardRef.current?.contentWindow?.postMessage(
          { type: 'setView', view: app === 'design' ? 'session' : 'board' },
          '*'
        )
      } catch (_) {}
    }
  }, [app])

  const bodyClass = [
    'studio-shell',
    dev === 'phone' ? 'force-phone' : '',
    focus ? 'focus' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={bodyClass}>
      <header className="cs-appbar">
        <div className="cs-brand">
          <span className="l1">PROCESS</span>
          <span className="l2">STUDIO</span>
        </div>

        <div className="cs-seg">
          {APPS.map((a) => (
            <button
              key={a.id}
              className={app === a.id ? 'on' : ''}
              onClick={() => setApp(a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="cs-hint">{HINTS[app]}</div>

        {/* 로그인 버튼은 디바이스 토글 왼쪽, 디바이스 토글은 맨 오른쪽 */}
        <AuthBar />

        <div className="cs-devtoggle" title="화면 미리보기 전환">
          <button
            className={dev === 'auto' ? 'on' : ''}
            onClick={() => changeDev('auto')}
            title="데스크톱·태블릿"
            aria-label="데스크톱 보기"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="13" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </button>
          <button
            className={dev === 'phone' ? 'on' : ''}
            onClick={() => changeDev('phone')}
            title="폰 화면"
            aria-label="폰 보기"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="2" width="12" height="20" rx="2.5" />
              <path d="M11 18h2" />
            </svg>
          </button>
        </div>
      </header>

      <div className="cs-frames">
        {!boardLoaded && (app === 'board' || app === 'design') && (
          <div className="cs-loading">불러오는 중…</div>
        )}
        <iframe
          ref={boardRef}
          title="작전판"
          src={SRC.board}
          allow="fullscreen"
          allowFullScreen
          style={{ display: FRAME_OF[app] === 'board' ? 'block' : 'none' }}
          onLoad={(e) => {
            setBoardLoaded(true)
            broadcastAuth(e.target.contentWindow)
          }}
        />
        <iframe
          ref={processRef}
          title="훈련 일정"
          src={SRC.process}
          style={{ display: app === 'process' ? 'block' : 'none' }}
          onLoad={(e) => broadcastAuth(e.target.contentWindow)}
        />
        <iframe
          ref={scoutRef}
          title="스카우트"
          src={SRC.scout}
          style={{ display: app === 'scout' ? 'block' : 'none' }}
          onLoad={(e) => broadcastAuth(e.target.contentWindow)}
        />
        <iframe
          ref={noteRef}
          title="훈련 노트"
          src={SRC.note}
          style={{ display: app === 'note' ? 'block' : 'none' }}
          onLoad={(e) => broadcastAuth(e.target.contentWindow)}
        />
        <iframe
          ref={gamemodelRef}
          title="게임 모델"
          src={SRC.gamemodel}
          style={{ display: app === 'gamemodel' ? 'block' : 'none' }}
          onLoad={(e) => broadcastAuth(e.target.contentWindow)}
        />
      </div>

      {saveStatus && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '22px',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.01em',
            color: '#fff',
            background:
              saveStatus === 'error'
                ? 'rgba(190,60,60,0.96)'
                : saveStatus === 'offline'
                  ? 'rgba(120,90,30,0.96)'
                  : 'rgba(28,30,38,0.94)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
            backdropFilter: 'blur(6px)',
            pointerEvents: 'none',
            transition: 'opacity .2s ease',
          }}
        >
          {saveStatus === 'saving' && (
            <>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'csspin 0.7s linear infinite',
                }}
              />
              저장 중…
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#46d17f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              저장됨
            </>
          )}
          {saveStatus === 'offline' && (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f0c060" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l18 18M8.5 8.5A7 7 0 0 0 4 11M12 5a11 11 0 0 1 7 2.6M7.5 12.5A4 4 0 0 1 12 11M12 19h.01" />
              </svg>
              오프라인 — 로컬에 저장됨
            </>
          )}
          {saveStatus === 'error' && <>저장 실패 — 다시 시도할게요</>}
          <style>{'@keyframes csspin{to{transform:rotate(360deg)}}'}</style>
        </div>
      )}
    </div>
  )
}
