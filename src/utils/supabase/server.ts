import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createGenericClient } from '@supabase/supabase-js'

// 인증용 클라이언트 (쿠키 기반)
export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // maxAge를 제거하여 세션 쿠키로 만들어 브라우저 종료 시 자동 삭제되도록 합니다.
            const newOptions = { ...options, maxAge: undefined }
            cookieStore.set({ name, value, ...newOptions })
          } catch (error) {
            // 서버 컴포넌트에서 set 메서드가 호출될 때 발생할 수 있습니다.
            // 미들웨어가 세션을 새로고침하므로 무시할 수 있습니다.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // 서버 컴포넌트에서 delete 메서드가 호출될 때 발생할 수 있습니다.
            // 미들웨어가 세션을 새로고침하므로 무시할 수 있습니다.
          }
        },
      },
    }
  )
}

// 학습 데이터용 클라이언트 (서비스 키 기반)
export function createLearningClient() {
  const isServer = typeof window === 'undefined';

  if (
    !process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL ||
    !process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Missing Supabase credentials for learning database');
  }

  return createGenericClient(
    process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL,
    process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      }
    }
  );
} 