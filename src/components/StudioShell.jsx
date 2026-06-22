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
  // app.html 최신본 신규 사용자 데이터
  'cs_drill_lib_v1',
  'cs_drill_form_v1',
  'cs_match_roster_v1',
  'cs_opp_team',
  'cs_themes_v1',
  'cs_note_custcol',
  'cs_board_live_v1',
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

// 탭 아이콘 (app(1).html 동일) — 모바일 하단 탭바에서 표시
const SVGI = (children) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)
const TAB_ICONS = {
  board: SVGI(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M12 5v14M12 12h.01" /><circle cx="12" cy="12" r="2.6" /></>),
  design: SVGI(<><path d="M9 5h6M9 5a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2M9 5V4a1 1 0 011-1h4a1 1 0 011 1v1" /><path d="M9 11h6M9 15h4" /></>),
  process: SVGI(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>),
  scout: SVGI(<><circle cx="10" cy="8" r="3.4" /><path d="M4 20c0-3.3 2.7-6 6-6 1.2 0 2.3.3 3.2 1" /><circle cx="17" cy="16" r="3.2" /><path d="M19.4 18.4L22 21" /></>),
  note: SVGI(<><path d="M4 20l1.2-4L16.4 4.8a2 2 0 012.8 0l0 0a2 2 0 010 2.8L8 18.8 4 20z" /><path d="M14 6.5l3.5 3.5" /></>),
  print: SVGI(<><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="7" /></>),
}
// 상단 탭 (app(1).html 동일 구성: 6개, 게임모델은 팀 안)
const APPS = [
  { id: 'board', label: '작전판' },
  { id: 'design', label: '보관함' }, // 보드의 session 뷰(드릴 보관함) 재사용
  { id: 'process', label: '일정' },
  { id: 'scout', label: '팀' }, // 선수단·스카우트·게임모델
  { id: 'note', label: '노트' },
  { id: 'print', label: '양식' }, // 빈 양식 인쇄/PDF
]

const HINTS = {
  board: '전술·세션을 그리고, 애니메이션·영상으로 내보내세요',
  design: '드릴 블록을 쌓아 오늘 세션을 만들고, 링크·PDF로 전달하세요',
  process: '경기일(MD) 기준 자동 주기화 · 훈련 블록에서 작전판 첨부 가능',
  scout: '포지션이 원하는 바와 선수의 현재를 속성별로 비교해 디렉터 보고서로 내보내세요',
  note: '아이패드 펜슬로 자유롭게 — 줄노트·모눈·피치 배경, 이미지 내보내기',
  gamemodel: '4국면별 우리 팀의 플레이 원칙을 정리하고 문서로 내보내세요',
  print: '펜으로 기입하는 빈 양식 — 미리보기 후 인쇄/PDF 저장',
}

// 첫 방문 웰컴 화면의 탭 소개
const WELCOME_ITEMS = [
  ['보드', '전술 작전판 · 경기·미팅 모드'],
  ['훈련 디자인', '드릴을 쌓아 오늘 세션 설계'],
  ['일정', '경기일(MD) 기준 주간·월간 계획'],
  ['팀', '선수단 · 스카우트 · 게임모델'],
  ['노트', '펜슬 필기 노트 · PDF 불러오기'],
  ['양식', '펜으로 쓰는 1장짜리 인쇄 폼'],
]

// 출력 양식 카드 (문서는 process/scout iframe 이 생성)
const PRINT_FORMS = [
  { k: 'month', icon: '📅', name: '월간 양식', desc: '이번 달 달력 + 기입 칸' },
  { k: 'week', icon: '🗓', name: '주간 양식', desc: '월~일 7칸 괘선 폼' },
  { k: 'day', icon: '📌', name: '일간 양식', desc: '하루 훈련 + 코칭 메모' },
  { k: 'matchday', icon: '📋', name: '매치데이 양식', desc: '라인업 피치 + 교체·세트피스' },
]

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

// ── 공유: 상태를 URL 해시로 압축(deflate-raw + base64url). 백엔드 없이 링크 공유 ──
function zips(str) {
  const cs = new CompressionStream('deflate-raw')
  const w = cs.writable.getWriter()
  w.write(new TextEncoder().encode(str))
  w.close()
  return new Response(cs.readable).arrayBuffer().then((buf) => {
    let b = ''
    new Uint8Array(buf).forEach((x) => {
      b += String.fromCharCode(x)
    })
    return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  })
}
function unzips(b64) {
  b64 = b64.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  const bin = atob(b64)
  const u = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
  const ds = new DecompressionStream('deflate-raw')
  const w = ds.writable.getWriter()
  w.write(u)
  w.close()
  return new Response(ds.readable)
    .arrayBuffer()
    .then((buf) => new TextDecoder().decode(buf))
}

// 공유 스냅(렌더 SVG 없음) → 보드 iframe 에 snapToThumb 요청해 다이어그램 렌더
function SnapThumb({ snap, boardRef }) {
  const [svg, setSvg] = useState(null)
  useEffect(() => {
    if (!snap) { setSvg(''); return }
    const id = 't' + Math.random().toString(36).slice(2)
    let tries = 0
    let done = false
    function onM(e) {
      const d = e.data || {}
      if (d.type === 'snapToThumbResult' && d.id === id) {
        done = true
        window.removeEventListener('message', onM)
        setSvg(d.svg || '')
      }
    }
    window.addEventListener('message', onM)
    function req() {
      if (done) return
      const fr = boardRef?.current
      if (tries > 14 || !fr || !fr.contentWindow) {
        window.removeEventListener('message', onM)
        setSvg('')
        return
      }
      tries++
      try {
        fr.contentWindow.postMessage({ type: 'snapToThumb', id, snap }, '*')
      } catch (_) {}
      setTimeout(() => { if (!done) req() }, 400)
    }
    req()
    return () => window.removeEventListener('message', onM)
  }, [snap, boardRef])
  const box = { border: '1px solid #e3e6eb', borderRadius: '10px', overflow: 'hidden', margin: '0 0 16px', background: '#fff', minHeight: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa6b2', fontSize: '12px', fontWeight: 700 }
  if (svg === null) return <div style={box}>다이어그램 불러오는 중…</div>
  if (!svg) return <div style={box}>(다이어그램 없음)</div>
  return (
    <div
      style={{ border: '1px solid #e3e6eb', borderRadius: '10px', overflow: 'hidden', margin: '0 0 16px', background: '#fff' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

// 공유 링크 수신 뷰어 (작전판/세션/주간 일정/드릴)
function ShareViewer({ obj, boardRef, onClose, onImport, onImportDrills }) {
  const title =
    (obj.kind === 'drill'
      ? obj.name || '드릴'
      : obj.kind === 'board'
        ? '공유된 작전판'
        : obj.kind === 'session'
          ? '공유된 훈련 세션'
          : '공유된 주간 일정') +
    (obj.kind !== 'drill' && obj.title ? ' · ' + obj.title : '')
  return (
    <div className="shview" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="shp">
        <h3>{title}</h3>
        {obj.kind === 'drill' && (
          <>
            <div style={{ fontSize: '12.5px', color: '#7d828c', margin: '-4px 0 14px' }}>
              {obj.focus && <b style={{ color: '#16181C' }}>{obj.focus}</b>}
              {(obj.focus ? ' · ' : '') + 'RPE ' + (obj.rpe || 5) + ' · ' + (obj.sets > 1 && obj.per ? obj.per + '분×' + obj.sets + '세트' : (obj.minutes || 0) + '분')}
            </div>
            {obj.thumb ? (
              <div
                style={{ border: '1px solid #e3e6eb', borderRadius: '10px', overflow: 'hidden', margin: '0 0 16px', background: '#fff' }}
                dangerouslySetInnerHTML={{ __html: obj.thumb }}
              />
            ) : obj.snap ? (
              <SnapThumb snap={obj.snap} boardRef={boardRef} />
            ) : null}
            {(obj.secs || []).map((sc, i) => (
              <div key={i} style={{ margin: '0 0 13px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#9097A0', letterSpacing: '.02em', marginBottom: '3px' }}>{sc[0]}</div>
                <div style={{ fontSize: '13px', color: 'var(--txt)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{sc[1]}</div>
              </div>
            ))}
            {obj.scenes && obj.scenes.length
              ? obj.scenes.map((sv, i) => (
                  <div key={'sc' + i} style={{ border: '1px solid #e3e6eb', borderRadius: '10px', overflow: 'hidden', margin: '0 0 16px', background: '#fff' }} dangerouslySetInnerHTML={{ __html: sv }} />
                ))
              : (obj.sceneSnaps || []).map((sn, i) => (
                  <SnapThumb key={'ss' + i} snap={sn} boardRef={boardRef} />
                ))}
          </>
        )}
        {obj.kind === 'board' && obj.thumb && (
          <img
            alt="작전판"
            src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(obj.thumb)}
          />
        )}
        {obj.kind === 'session' && obj.drills && (
          <>
            <div style={{ fontSize: '12.5px', color: '#7d828c', margin: '-6px 0 12px' }}>
              {obj.drills.length}개 드릴 · 총{' '}
              {obj.drills.reduce((s, d) => s + (+d.minutes || 0), 0)}분
              {obj.date ? ' · ' + obj.date : ''}
              {obj.md ? ' · ' + obj.md : ''}
            </div>
            {obj.drills.map((d, ix) => (
              <div
                key={ix}
                style={{ display: 'flex', gap: '12px', padding: '10px 0', borderTop: '1px solid var(--line)' }}
              >
                {d.thumb && (
                  <img
                    alt=""
                    style={{ width: '118px', height: '74px', objectFit: 'cover', border: '1px solid var(--line)', borderRadius: '8px', flex: '0 0 auto', background: '#fff' }}
                    src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(d.thumb)}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--txt)' }}>
                    {ix + 1}. {d.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#7d828c', margin: '2px 0 4px' }}>
                    {(d.focus ? d.focus + ' · ' : '') + 'RPE ' + d.rpe + ' · ' + (d.sets > 1 && d.per ? d.per + '분×' + d.sets + '세트' : (d.minutes || 0) + '분')}
                  </div>
                  {d.overview && (
                    <div style={{ fontSize: '12px', color: 'var(--txt)' }}>{d.overview}</div>
                  )}
                  {d.coaching && (
                    <div style={{ fontSize: '11.5px', color: '#7d828c', marginTop: '2px' }}>
                      코칭: {d.coaching}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
        {obj.kind === 'week' && obj.days && (
          <table>
            <tbody>
              {obj.days.map((d, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {d.d + (d.md ? ' · ' + d.md : '') + (d.match ? ' · 경기' : '') + (d.off ? ' · OFF' : '')}
                  </td>
                  <td>
                    {!(d.tr && d.tr.length) && !d.match ? (
                      <span style={{ color: '#9097A0' }}>—</span>
                    ) : (
                      (d.tr || []).map((x, j) => (
                        <div key={j}>
                          <div>{(x.time ? x.time + ' · ' : '') + (x.aims || '훈련') + ' · ' + (x.mins || 0) + '분'}</div>
                          <div style={{ fontSize: '11.5px', color: '#7d828c', margin: '1px 0 6px' }}>
                            {(x.blocks || []).map((b2) => (b2.theme || b2.phase || '') + (b2.theme && b2.phase ? ' (' + b2.phase + ')' : '') + " " + (b2.dur || 0) + "'").join('  /  ')}
                          </div>
                        </div>
                      ))
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="shact">
          {obj.kind === 'board' && obj.snap && (
            <button className="pri" onClick={() => onImport(obj.snap)}>
              내 작전판으로 불러오기
            </button>
          )}
          {obj.kind === 'session' && obj.drills && obj.drills.length > 0 && (
            <button className="pri" onClick={() => onImportDrills(obj.drills)}>
              내 보관함에 담기
            </button>
          )}
          {obj.kind === 'drill' && (
            <button
              className="pri"
              onClick={() =>
                onImportDrills([
                  {
                    name: obj.name,
                    minutes: obj.minutes,
                    per: obj.minutes,
                    sets: obj.sets,
                    rpe: obj.rpe,
                    overview: (obj.secs || []).map((s) => s[0] + ': ' + s[1]).join('\n'),
                    snap: obj.snap,
                  },
                ])
              }
            >
              내 보관함에 담기
            </button>
          )}
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
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
  // 보드(기본 앱)가 준비되면 부팅 스플래시를 페이드 제거
  useEffect(() => {
    if (!boardLoaded) return
    const s = document.getElementById('cs-splash')
    if (!s) return
    s.style.opacity = '0'
    const t = setTimeout(() => s.remove(), 400)
    return () => clearTimeout(t)
  }, [boardLoaded])
  // 출력 미리보기: null | { doc:string, rebuild:(ink)=>string }
  const [printPreview, setPrintPreview] = useState(null)
  const [printInk, setPrintInk] = useState(false)
  const pvIframeRef = useRef(null)
  // 첫 방문 웰컴 화면
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      return !localStorage.getItem('cs_welcomed_v1')
    } catch (_) {
      return false
    }
  })
  function dismissWelcome() {
    setShowWelcome(false)
    try {
      localStorage.setItem('cs_welcomed_v1', '1')
    } catch (_) {}
  }
  // 다국어(ko/ja/en/zh/es/pt) — i18n.js 엔진이 DOM 을 직접 번역, 여기선 선택 UI 만
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('cs_lang') || 'ko'
    } catch (_) {
      return 'ko'
    }
  })
  function changeLang(l) {
    setLang(l)
    try {
      window.csI18n?.setLang(l)
    } catch (_) {}
  }
  // 설정(기어) 팝업 + 백업 다운로드/복원
  const [gearOpen, setGearOpen] = useState(false)
  const bkFileRef = useRef(null)
  // 내장 사용법 가이드 오버레이 (app(1): /guide/ 를 새 탭 대신 앱 내 패널로)
  const [guideOpen, setGuideOpen] = useState(false)
  // 백업 권장 배너 (app(1): 데이터 많고 오래 백업 안 했으면 상단 알림)
  const [bkMsg, setBkMsg] = useState(null)
  useEffect(() => {
    const KEY = 'cs_lastbk'
    const SN = 'cs_bksnooze'
    const D = 864e5
    let size = 0
    try {
      for (let i = 0; i < localStorage.length; i++)
        size += (localStorage.getItem(localStorage.key(i)) || '').length
    } catch (_) {}
    let last = 0
    let sn = 0
    try {
      last = +localStorage.getItem(KEY) || 0
      sn = +localStorage.getItem(SN) || 0
    } catch (_) {}
    const now = Date.now()
    if (size > 20000 && now - last > 7 * D && now - sn > 3 * D) {
      const days = last ? Math.floor((now - last) / D) : 0
      setBkMsg(
        (last ? '마지막 백업이 ' + days + '일 전이에요' : '아직 백업한 적이 없어요') +
          ' — 데이터는 이 기기 브라우저에만 저장돼요'
      )
    }
  }, [])
  function bkSnooze() {
    try {
      localStorage.setItem('cs_bksnooze', String(Date.now()))
    } catch (_) {}
    setBkMsg(null)
  }
  async function backupDownload() {
    const data = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        data[k] = localStorage.getItem(k)
      }
    } catch (_) {}
    try {
      if (window.storage) Object.assign(data, await window.storage.getAll())
    } catch (_) {}
    const payload = {
      type: 'process-studio-backup',
      version: 1,
      date: new Date().toISOString(),
      data,
    }
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const dt = new Date()
    const p = (n) => (n < 10 ? '0' : '') + n
    a.download =
      'process-studio-backup-' +
      dt.getFullYear() +
      p(dt.getMonth() + 1) +
      p(dt.getDate()) +
      '.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    try {
      localStorage.setItem('cs_lastbk', String(Date.now()))
    } catch (_) {}
    setBkMsg(null)
    setGearOpen(false)
  }
  async function backupRestore(file) {
    if (!file) return
    try {
      const p = JSON.parse(await file.text())
      if (!p || p.type !== 'process-studio-backup' || !p.data)
        throw new Error('bad')
      if (!confirm('백업을 불러오면 현재 데이터를 덮어씁니다. 계속할까요?')) return
      for (const k of Object.keys(p.data)) {
        try {
          localStorage.setItem(k, p.data[k])
        } catch (_) {}
        try {
          if (window.storage) await window.storage.set(k, p.data[k])
        } catch (_) {}
      }
      alert('복원 완료 — 화면을 새로고침합니다')
      location.reload()
    } catch (_) {
      alert('백업 파일을 읽을 수 없어요')
    }
  }

  // ── 공유: 현재 앱(작전판/세션/주간)을 압축 링크로 복사 ──
  const [shareObj, setShareObj] = useState(null)
  async function shareCurrent() {
    // design/board → 보드 iframe, process → 일정 iframe
    const ref = app === 'process' ? processRef : boardRef
    const win = ref.current?.contentWindow
    if (!win || typeof win.__exportShare !== 'function') {
      alert('지금 화면은 공유를 지원하지 않아요')
      return
    }
    let data
    try {
      data = win.__exportShare()
    } catch (_) {
      data = null
    }
    if (!data) {
      alert('공유할 내용이 없어요')
      return
    }
    try {
      const z = await zips(JSON.stringify(data))
      const url = location.href.split('#')[0] + '#share=' + z
      if (url.length > 60000) {
        alert('내용이 너무 커서 링크로 공유할 수 없어요')
        return
      }
      try {
        await navigator.clipboard.writeText(url)
        alert('공유 링크를 복사했어요 — 붙여넣어 전달하세요')
      } catch (_) {
        prompt('아래 링크를 복사해 전달하세요', url)
      }
    } catch (_) {
      alert('공유 링크를 만들 수 없어요')
    }
  }
  // 수신: URL 해시(#share=)로 들어오면 압축을 풀어 뷰어로 표시
  useEffect(() => {
    if (location.hash.indexOf('#share=') !== 0) return
    const z = location.hash.slice('#share='.length)
    unzips(z)
      .then((s) => {
        try {
          setShareObj(JSON.parse(s))
        } catch (_) {}
      })
      .catch(() => {})
  }, [])
  function closeShare() {
    setShareObj(null)
    try {
      history.replaceState(null, '', location.pathname + location.search)
    } catch (_) {}
  }
  function importShare(snap) {
    const win = boardRef.current?.contentWindow
    if (win && typeof win.__importShare === 'function') {
      try {
        win.__importShare(snap)
      } catch (_) {}
    }
    setApp('board')
    closeShare()
  }
  // 공유 뷰어: 세션/드릴을 내 보관함(훈련 디자인)에 담기
  function importDrills(drills) {
    const win = boardRef.current?.contentWindow
    if (win && typeof win.__importSessionDrills === 'function') {
      try {
        win.__importSessionDrills(drills)
      } catch (_) {}
    }
    setApp('design')
    closeShare()
  }
  // 드릴/보드 공유: 보드가 보낸 payload 를 용량 단계별로 압축해 링크 생성(app.html 신기능)
  function shareDataLink(pl) {
    const cl = (o) => JSON.parse(JSON.stringify(o))
    const tiers = []
    if (pl.kind === 'drill') {
      tiers.push({ obj: pl })
      const a2 = cl(pl)
      a2.sceneSnaps = []
      tiers.push({ obj: a2 })
      const a3 = cl(pl)
      a3.sceneSnaps = []
      delete a3.snap
      tiers.push({ obj: a3, note: '(용량이 커서 다이어그램은 제외했어요)' })
    } else if (pl.kind === 'board') {
      if (!pl.snap) {
        alert('이 항목은 링크 공유를 지원하지 않아요 — 파일 내보내기(JSON)를 사용하세요')
        return
      }
      const strip = (sn) => {
        try {
          const c = cl(sn)
          c.customImages = []
          if (c.players)
            c.players = c.players.map((p) => {
              if (p && p.team === 'img') {
                p = cl(p)
                p.team = 'blue'
              }
              return p
            })
          return c
        } catch (_) {
          return sn
        }
      }
      tiers.push({ obj: pl })
      const b2 = cl(pl)
      delete b2.thumb
      tiers.push({ obj: b2 })
      const b3 = cl(pl)
      delete b3.thumb
      b3.snap = strip(pl.snap)
      tiers.push({ obj: b3, note: '(용량이 커서 사진은 제외했어요)' })
    } else {
      tiers.push({ obj: pl })
    }
    const copy = (url, note) => {
      const msg = '공유 링크가 복사됐어요 ✓ 붙여넣어 전달하세요' + (note ? '\n' + note : '')
      if (navigator.clipboard?.writeText)
        navigator.clipboard.writeText(url).then(() => alert(msg), () => prompt('아래 링크를 복사해 전달하세요', url))
      else prompt('아래 링크를 복사해 전달하세요', url)
    }
    const go = (i) => {
      if (i >= tiers.length) {
        alert('내용이 너무 커서 링크로 만들 수 없어요 — 파일 내보내기(JSON)를 사용하세요')
        return
      }
      zips(JSON.stringify(tiers[i].obj)).then((z) => {
        const url = location.href.split('#')[0] + '#share=' + z
        if (url.length > 60000) {
          go(i + 1)
          return
        }
        copy(url, tiers[i].note)
      })
    }
    go(0)
  }

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

  // iframe(같은 출처) 문서를 다국어 엔진에 등록 → 부모가 직접 번역/감시
  function registerFrameI18n(win) {
    try {
      window.csI18n?.register(win.document, win)
    } catch (_) {}
  }
  // iframe onLoad 공통 처리: 로그인 상태 알림 + 다국어 등록
  function onFrameLoad(e) {
    broadcastAuth(e.target.contentWindow)
    registerFrameI18n(e.target.contentWindow)
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

  // 출력 양식 카드 클릭 → process/scout iframe 이 문서(HTML)를 생성, 미리보기 표시
  function openPrintForm(kind) {
    try {
      if (kind === 'matchday') {
        const fn = (ink) =>
          scoutRef.current?.contentWindow?.__matchdayDoc(true, ink)
        const doc = fn(false)
        if (doc) {
          setPrintInk(false)
          setPrintPreview({ doc, rebuild: fn })
        }
      } else {
        const doc = processRef.current?.contentWindow?.__buildPrintDoc(kind, true)
        if (doc) {
          setPrintInk(false)
          setPrintPreview({ doc, rebuild: null })
        }
      }
    } catch (_) {
      alert('아직 준비 중이에요 — 잠시 후 다시 시도해주세요')
    }
  }
  function togglePrintInk(on) {
    setPrintInk(on)
    if (printPreview?.rebuild) {
      try {
        setPrintPreview({ ...printPreview, doc: printPreview.rebuild(on) })
      } catch (_) {}
    }
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
      } else if (d.type === 'goApp' && d.app && APPS.some((a) => a.id === d.app)) {
        // 서브앱이 다른 탭으로 이동 요청 (예: 일정 → 양식)
        setApp(d.app)
      } else if (d.source === 'board' && d.type === 'shareData' && d.payload) {
        // 보드 라이브러리의 드릴/보드 공유 → 용량 단계별 링크 생성
        shareDataLink(d.payload)
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
              data-app={a.id}
              className={app === a.id || (a.id === 'scout' && app === 'gamemodel') ? 'on' : ''}
              onClick={() => setApp(a.id)}
            >
              {TAB_ICONS[a.id]}
              <span className="tl-l">{a.label}</span>
            </button>
          ))}
        </div>

        <div className="cs-hint">{HINTS[app]}</div>

        {/* 로그인 버튼은 디바이스 토글 왼쪽, 디바이스 토글은 맨 오른쪽 */}
        <AuthBar />

        {(app === 'board' || app === 'design' || app === 'process') && (
          <button
            className="cs-share"
            title="공유 링크 복사"
            aria-label="공유"
            onClick={shareCurrent}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
              <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
            </svg>
          </button>
        )}

        <div className="cs-gear">
          <button
            className="cs-gearbtn"
            title="설정"
            aria-label="설정"
            onClick={() => setGearOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
          {gearOpen && (
            <>
              <div className="cs-gearscrim" onClick={() => setGearOpen(false)} />
              <div className="cs-gearpop">
                <button
                  className="cs-gprow-btn"
                  onClick={() => {
                    setGearOpen(false)
                    setGuideOpen(true)
                  }}
                >
                  📖 사용법 가이드
                </button>
                <div className="cs-gprow">
                  <span className="cs-gplb">언어</span>
                  <div className="cs-langsw" role="group" aria-label="Language">
                    {[
                      ['ko', '한'],
                      ['ja', '日'],
                      ['en', 'EN'],
                      ['zh', '中'],
                      ['es', 'ES'],
                      ['pt', 'PT'],
                    ].map(([code, label]) => (
                      <button
                        key={code}
                        className={lang === code ? 'on' : ''}
                        onClick={() => changeLang(code)}
                        aria-pressed={lang === code}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cs-gprow">
                  <span className="cs-gplb">백업</span>
                  <div className="cs-gpbtns">
                    <button onClick={backupDownload} title="데이터 백업 (JSON 내려받기)">
                      ⤓ 내려받기
                    </button>
                    <button
                      onClick={() => bkFileRef.current?.click()}
                      title="백업 불러오기 (JSON)"
                    >
                      ⤒ 불러오기
                    </button>
                  </div>
                </div>
                <div className="cs-gprow">
                  <span className="cs-gplb">화면</span>
                  <div className="cs-laysw" role="group" aria-label="화면">
                    {[
                      ['auto', '자동'],
                      ['phone', '모바일'],
                      ['desktop', '컴퓨터'],
                    ].map(([mode, label]) => (
                      <button
                        key={mode}
                        className={dev === mode ? 'on' : ''}
                        onClick={() => changeDev(mode)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cs-gphint">
                  로그인 시 클라우드에 자동 저장돼요. 로그아웃·오프라인 대비
                  백업을 권장합니다.
                </div>
              </div>
            </>
          )}
          <input
            ref={bkFileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              backupRestore(e.target.files && e.target.files[0])
              e.target.value = ''
            }}
          />
        </div>

      </header>

      {bkMsg && (
        <div className="cs-bkbanner">
          <span>{bkMsg}</span>
          <span className="cs-bkbtns">
            <button className="cs-bknow" onClick={backupDownload}>
              지금 백업
            </button>
            <button className="cs-bklater" onClick={bkSnooze}>
              나중에
            </button>
          </span>
        </div>
      )}

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
            onFrameLoad(e)
          }}
        />
        <iframe
          ref={processRef}
          title="훈련 일정"
          src={SRC.process}
          style={{ display: app === 'process' ? 'block' : 'none' }}
          onLoad={(e) => onFrameLoad(e)}
        />
        <iframe
          ref={scoutRef}
          title="스카우트"
          src={SRC.scout}
          style={{ display: app === 'scout' ? 'block' : 'none' }}
          onLoad={(e) => onFrameLoad(e)}
        />
        <iframe
          ref={noteRef}
          title="훈련 노트"
          src={SRC.note}
          style={{ display: app === 'note' ? 'block' : 'none' }}
          onLoad={(e) => onFrameLoad(e)}
        />
        <iframe
          ref={gamemodelRef}
          title="게임 모델"
          src={SRC.gamemodel}
          style={{ display: app === 'gamemodel' ? 'block' : 'none' }}
          onLoad={(e) => onFrameLoad(e)}
        />
        {app === 'print' && (
          <div className="cs-printpanel">
            <h2>양식 — 펜으로 쓰는 1장 폼</h2>
            <p>
              펜으로 기입하는 1장짜리 폼이에요. 누르면 미리보기가 뜨고, 인쇄하거나
              PDF로 저장할 수 있어요.
            </p>
            <div className="cs-printgrid">
              {PRINT_FORMS.map((f) => (
                <button
                  key={f.k}
                  className="cs-pcard"
                  onClick={() => openPrintForm(f.k)}
                >
                  <span className="pc-i">{f.icon}</span>
                  <b>{f.name}</b>
                  <span>{f.desc}</span>
                </button>
              ))}
            </div>
            <div className="cs-printnote">
              ✍️ 기입한 내용이 채워진 출력은 <b>일정</b>·<b>팀</b> 탭 안의 출력
              버튼에서 — 입력한 일정·라인업이 그대로 폼에 들어갑니다.
            </div>
          </div>
        )}
      </div>

      {printPreview && (
        <div
          className="cs-pvov"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPrintPreview(null)
          }}
        >
          <div className="cs-pvbar">
            <b>출력 미리보기</b>
            <div className="cs-pvact">
              {printPreview.rebuild && (
                <label className="cs-pvink">
                  <input
                    type="checkbox"
                    checked={printInk}
                    onChange={(e) => togglePrintInk(e.target.checked)}
                  />
                  🖍 잉크 절약
                </label>
              )}
              <button
                className="cs-pvgo"
                onClick={() => {
                  try {
                    pvIframeRef.current?.contentWindow?.focus()
                    pvIframeRef.current?.contentWindow?.print()
                  } catch (_) {}
                }}
              >
                🖨 인쇄 / PDF 저장
              </button>
              <button className="cs-pvx" onClick={() => setPrintPreview(null)}>
                닫기
              </button>
            </div>
          </div>
          <div className="cs-pvwrap">
            <iframe
              ref={pvIframeRef}
              title="출력 미리보기"
              srcDoc={printPreview.doc}
            />
          </div>
        </div>
      )}

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

      {showWelcome && (
        <div className="cs-welcome" onMouseDown={(e) => { if (e.target === e.currentTarget) dismissWelcome() }}>
          <div className="cw-card">
            <div className="cw-h">
              <span className="wm">
                <b>PRO</b>CESS <b>STUDIO</b>
              </span>
            </div>
            <div className="cw-sub">코치의 과정을 하나로 — 탭에서 전환하세요.</div>
            <div className="cw-list">
              {WELCOME_ITEMS.map(([t, d]) => (
                <div className="cw-i" key={t}>
                  <b>{t}</b>
                  <span>{d}</span>
                </div>
              ))}
            </div>
            <div className="cw-note">
              💾 데이터는 이 기기 브라우저에 저장돼요. 로그인하면 Supabase에
              자동 백업되고, 기기를 옮겨도 이어집니다.
            </div>
            <button
              className="cw-guide"
              onClick={() => {
                dismissWelcome()
                setGuideOpen(true)
              }}
            >
              사용법 가이드 보기
            </button>
            <button className="cw-ok" onClick={dismissWelcome}>
              시작하기
            </button>
          </div>
        </div>
      )}

      {shareObj && (
        <ShareViewer
          obj={shareObj}
          boardRef={boardRef}
          onClose={closeShare}
          onImport={importShare}
          onImportDrills={importDrills}
        />
      )}

      {guideOpen && (
        <div
          className="cs-guideov"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setGuideOpen(false)
          }}
        >
          <div className="cs-guidepanel">
            <button
              className="cs-guideclose"
              aria-label="닫기"
              onClick={() => setGuideOpen(false)}
            >
              ✕
            </button>
            <iframe title="사용법 가이드" src="/guide/" />
          </div>
        </div>
      )}
    </div>
  )
}
