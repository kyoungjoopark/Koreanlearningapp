import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createGenericClient } from '@supabase/supabase-js'

// 인증용 클라이언트 (쿠키 기반)
export function createClient(cookieStore: ReturnType<typeof cookies>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // 빌드 시점에는 더미 클라이언트를 반환
    if (process.env.NODE_ENV === 'production') {
      return createServerClient('https://dummy.supabase.co', 'dummy-key', {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // 더미 구현
          },
          remove(name: string, options: CookieOptions) {
            // 더미 구현
          },
        },
      });
    } else {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
    }
  }
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
    // 빌드 시점에는 더미 클라이언트를 반환
    if (isServer && process.env.NODE_ENV === 'production') {
      return createGenericClient('https://dummy.supabase.co', 'dummy-key', {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
        }
      });
    } else {
      throw new Error('Missing Supabase credentials for learning database');
    }
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