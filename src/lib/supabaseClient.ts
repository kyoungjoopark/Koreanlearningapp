import { createBrowserClient } from '@supabase/ssr'

// @supabase/ssr을 사용하는 새로운 클라이언트 생성 함수
// 이 함수는 'utils/supabase/client.ts'의 내용과 거의 동일하게 만들어
// 프로젝트 전체의 클라이언트 생성 방식을 통일합니다.
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY!,
    {
      auth: {
        // 브라우저가 닫히면 세션이 만료되도록 sessionStorage를 사용합니다.
        storage: typeof window !== 'undefined' ? sessionStorage : undefined,
        autoRefreshToken: true,
        persistSession: true, // sessionStorage 내에서 세션을 유지합니다.
        detectSessionInUrl: true,
      },
    }
  )

// 다른 파일들과의 호환성을 위해 supabase 인스턴스를 직접 export 합니다.
export const supabase = createClient()

export default supabase 