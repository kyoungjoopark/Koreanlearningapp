import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export const createClient = (request: NextRequest) => {
  // 쿠키를 저장할 응답 객체를 생성합니다.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // maxAge를 제거하여 세션 쿠키로 만들어 브라우저 종료 시 자동 삭제되도록 합니다.
          const newOptions = { ...options, maxAge: undefined }
          // 쿠키를 안정적으로 설정하기 위한 공식적인 방법입니다.
          request.cookies.set({ name, value, ...newOptions })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...newOptions })
        },
        remove(name: string, options: CookieOptions) {
          // 쿠키를 안정적으로 삭제하기 위한 공식적인 방법입니다.
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  return { supabase, response }
} 