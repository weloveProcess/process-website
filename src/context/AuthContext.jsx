import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// OAuth 로그인 후 돌아올 주소. 배포 도메인/로컬 모두 자동 대응.
const redirectTo =
  typeof window !== 'undefined' ? window.location.origin : undefined

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 세션 로드 (OAuth 리다이렉트로 돌아온 경우 URL 의 토큰도 자동 처리)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // 로그인/로그아웃 변화 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    // 카카오 로그인 (Supabase Auth → Providers → Kakao 활성화 필요)
    // scopes 를 지정하지 않으면 Supabase 기본값(account_email profile_image
    // profile_nickname)이 요청된다. 닉네임만 받도록 profile_nickname 으로 고정.
    signInWithKakao: () =>
      supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo, scopes: 'profile_nickname' },
      }),
    // 구글 로그인 (Supabase Auth → Providers → Google 활성화 필요)
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
