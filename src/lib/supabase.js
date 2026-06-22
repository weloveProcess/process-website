import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
// Supabase 가 anon key → publishable key 로 명칭 변경. 새 이름 우선, 구 이름 폴백.
const anonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // 개발 중 환경변수 누락을 빠르게 알아채기 위한 경고
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY 가 설정되지 않았습니다. .env 파일을 확인하세요.'
  )
}

// 키가 없어도 createClient 가 throw 하지 않도록 플레이스홀더 사용 →
// 환경변수 미설정(로컬 등)에서도 앱이 렌더된다(클라우드 호출만 실패).
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
