import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthBar() {
  const { user, loading, signInWithKakao, signInWithGoogle, signOut } = useAuth()
  const [busy, setBusy] = useState(null) // 'kakao' | 'google'
  const [toast, setToast] = useState(null) // { type:'err', text }

  function flash(type, text) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 2800)
  }

  async function login(provider, fn) {
    setBusy(provider)
    const { error } = await fn()
    // 성공 시 OAuth 페이지로 리다이렉트되므로 아래는 보통 실행되지 않음
    if (error) {
      setBusy(null)
      flash('err', loginError(provider, error.message))
    }
  }

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.nickname ||
    user?.email ||
    '코치'

  return (
    <div className="cs-auth">
      {toast && <div className={`cs-toast ${toast.type}`}>{toast.text}</div>}

      {loading ? null : user ? (
        <>
          <span className="cs-user" title={user.email || ''}>
            {displayName}
          </span>
          <button className="cs-logout" onClick={signOut}>
            로그아웃
          </button>
        </>
      ) : (
        <>
          <button
            className="cs-login cs-kakao"
            onClick={() => login('kakao', signInWithKakao)}
            disabled={busy != null}
          >
            <KakaoIcon />
            {busy === 'kakao' ? '연결 중…' : '카카오 로그인'}
          </button>
          <button
            className="cs-login cs-google"
            onClick={() => login('google', signInWithGoogle)}
            disabled={busy != null}
          >
            <GoogleIcon />
            {busy === 'google' ? '연결 중…' : 'Google 로그인'}
          </button>
        </>
      )}
    </div>
  )
}

function loginError(provider, message = '') {
  if (message.includes('provider is not enabled'))
    return `${provider} 로그인이 아직 설정되지 않았습니다. (Supabase Providers 활성화 필요)`
  return message || '로그인 중 오류가 발생했습니다.'
}

function KakaoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#000"
        d="M12 3C6.48 3 2 6.48 2 10.8c0 2.78 1.86 5.21 4.65 6.58-.2.72-.74 2.66-.85 3.07-.13.51.19.5.4.36.16-.11 2.57-1.75 3.62-2.47.71.1 1.44.16 2.18.16 5.52 0 10-3.48 10-7.8S17.52 3 12 3Z"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 8.1 29.3 6 24 6 12.9 6 4 14.9 4 26s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5Z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 8.1 29.3 6 24 6 16.3 6 9.7 10.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 46c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 41.6 16.2 46 24 46Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C41 35.9 44 31.3 44 26c0-1.3-.1-2.7-.4-3.5Z" />
    </svg>
  )
}
