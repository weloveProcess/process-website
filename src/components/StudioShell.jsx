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
} from '../lib/boards'

const STATE_KINDS = ['matchnotes', 'match', 'schedule']

const HINTS = {
  board: '전술·세션을 그리고, 애니메이션·영상으로 내보내세요',
  process: '경기일(MD) 기준 자동 주기화 · 훈련 블록에서 작전판 첨부 가능',
}

export default function StudioShell() {
  const { user } = useAuth()
  const [app, setApp] = useState('board') // 'board' | 'process'
  const [dev, setDev] = useState('auto') // 'auto' | 'phone'
  const [focus, setFocus] = useState(false)
  const boardRef = useRef(null)
  const processRef = useRef(null)
  const [boardLoaded, setBoardLoaded] = useState(false)

  // 메시지 핸들러가 항상 최신 로그인 상태를 보도록 ref 로 보관
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])
  // 앱 저장 신호를 종류별로 디바운스(autosave 폭주 방지)
  const saveTimers = useRef({})

  // 두 iframe 을 새 데이터로 재로딩
  function reloadFrames() {
    setBoardLoaded(false)
    if (boardRef.current) boardRef.current.src = '/studio/board.html'
    if (processRef.current) processRef.current.src = '/studio/process.html'
  }

  // 로그인 상태를 두 앱(iframe)에 알림 → 앱이 Supabase 사용 여부 결정
  function broadcastAuth(win) {
    const enabled = !!userRef.current
    const targets = win
      ? [win]
      : [boardRef.current?.contentWindow, processRef.current?.contentWindow]
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

  // 두 앱 사이 브리지 릴레이 (원본 셸의 message 핸들러 이식)
  useEffect(() => {
    function onMessage(e) {
      const d = e.data || {}
      const board = boardRef.current
      const proc = processRef.current
      if (d.source === 'process' && d.type === 'openBoard') {
        setApp('board')
        try {
          board?.contentWindow.postMessage(
            { type: 'enterCapture', snap: d.snap },
            '*'
          )
        } catch (_) {}
      } else if (d.source === 'board' && d.type === 'capture') {
        try {
          proc?.contentWindow.postMessage(
            { type: 'boardResult', thumb: d.thumb, snap: d.snap },
            '*'
          )
        } catch (_) {}
        setApp('process')
      } else if (d.source === 'board' && d.type === 'captureCancel') {
        setApp('process')
      } else if (d.source === 'board' && d.type === 'sendToWeek') {
        setApp('process')
        try {
          proc?.contentWindow.postMessage(
            { type: 'importSession', session: d.session },
            '*'
          )
        } catch (_) {}
      } else if (d.source === 'board' && d.type === 'focusBoard') {
        setFocus(!!d.on)
      } else if (d.type === 'db') {
        // 항목별 저장/불러오기(배치·세션·내 구성) RPC
        handleDbRequest(d, e.source)
      } else if (d.type === 'cloudSave' && STATE_KINDS.includes(d.kind)) {
        // 단일 상태(매치노트·경기정보·훈련일정) → 디바운스 후 Supabase upsert
        if (!userRef.current) return
        const kind = d.kind
        clearTimeout(saveTimers.current[kind])
        saveTimers.current[kind] = setTimeout(() => {
          saveStateKind(kind).catch(() => {})
        }, 2500)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // 로그인 상태가 바뀌면 두 앱에 알림(이미 로드된 iframe 대상)
  useEffect(() => {
    broadcastAuth()
  }, [user])

  // 로그인하면 단일 상태를 동기화: 클라우드에 있으면 로컬로 복원,
  // 없으면(첫 로그인) 로컬을 클라우드에 seed. 항목별 데이터(배치/세션/구성)는
  // 앱이 로그인 신호를 받아 직접 merge-up + 목록 새로고침한다.
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
            if (restoreStateKind(kind, data.data)) wrote = true
          } else {
            // 클라우드에 없으면 현재 로컬 상태를 올려둔다(seed)
            await saveStateKind(kind).catch(() => {})
          }
        } catch (_) {}
      }
      if (wrote) reloadFrames()
    })()
  }, [user])

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
          <button
            className={app === 'board' ? 'on' : ''}
            onClick={() => setApp('board')}
          >
            보드
          </button>
          <button
            className={app === 'process' ? 'on' : ''}
            onClick={() => setApp('process')}
          >
            주기화
          </button>
        </div>

        <div className="cs-hint">{HINTS[app]}</div>

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

        <AuthBar />
      </header>

      <div className="cs-frames">
        {!boardLoaded && app === 'board' && (
          <div className="cs-loading">불러오는 중…</div>
        )}
        <iframe
          ref={boardRef}
          title="작전판"
          src="/studio/board.html"
          allow="fullscreen"
          allowFullScreen
          style={{ display: app === 'board' ? 'block' : 'none' }}
          onLoad={(e) => {
            setBoardLoaded(true)
            broadcastAuth(e.target.contentWindow)
          }}
        />
        <iframe
          ref={processRef}
          title="훈련 일정"
          src="/studio/process.html"
          style={{ display: app === 'process' ? 'block' : 'none' }}
          onLoad={(e) => broadcastAuth(e.target.contentWindow)}
        />
      </div>
    </div>
  )
}
