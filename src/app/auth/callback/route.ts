import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // 에러가 있는 경우 처리
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent('이메일 인증에 실패했습니다. 새로운 링크를 요청해주세요.')}`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent('인증 처리 중 오류가 발생했습니다.')}`)
      }

      if (data.session) {
        // 인증 성공 - 로그인 페이지로 리다이렉트 (이메일 인증 완료 메시지와 함께)
        console.log('User authenticated successfully:', data.user?.email)
        return NextResponse.redirect(`${origin}/auth?confirmed=true`)
      }
    } catch (err) {
      console.error('Unexpected error during auth callback:', err)
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent('예상치 못한 오류가 발생했습니다.')}`)
    }
  }

  // code가 없는 경우
  return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent('잘못된 인증 링크입니다.')}`)
} 