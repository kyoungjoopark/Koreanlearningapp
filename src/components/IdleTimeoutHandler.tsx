'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { usePathname } from 'next/navigation'

const IdleTimeoutHandler = () => {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const timeoutId = useRef<NodeJS.Timeout | null>(null)
  
  // 5분으로 설정 (5 * 60 * 1000 ms)
  const IDLE_TIMEOUT = 5 * 60 * 1000
  
  // 모바일 디바이스 감지
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 

  const logout = useCallback(async () => {
    // 이미 로그아웃된 상태이거나, 인증 페이지에 있다면 실행하지 않음
    if (pathname === '/auth') return;

    const { error } = await supabase.auth.signOut()
    if (!error) {
      // 로그아웃 성공 시 로그인 페이지로 이동하며 메시지 전달
      router.push('/auth?message=5분 동안 활동이 없어 자동 로그아웃되었습니다.')
    } else {
      console.error('자동 로그아웃 실패:', error)
    }
  }, [router, supabase, pathname])

  const resetTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current)
    }
    timeoutId.current = setTimeout(logout, IDLE_TIMEOUT)
  }, [logout])

  useEffect(() => {
    // 인증 페이지에서는 타이머를 실행하지 않음
    if (pathname === '/auth') {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      return;
    }

    // 모바일/데스크톱에 따라 다른 이벤트 사용
    const windowEvents = isMobile 
      ? ['touchstart', 'touchmove', 'touchend', 'scroll', 'orientationchange', 'focus', 'blur']
      : ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'focus', 'blur']

    const handleActivity = () => {
      console.log('[IdleTimeout] User activity detected on', isMobile ? 'mobile' : 'desktop')
      resetTimer()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[IdleTimeout] Page became visible - resetting timer')
        resetTimer()
      }
    }

    // 초기 타이머 설정 및 이벤트 리스너 등록
    resetTimer()
    
    // Window 이벤트 등록
    windowEvents.forEach((event) => {
      window.addEventListener(event as keyof WindowEventMap, handleActivity)
    })
    
    // Document 이벤트 등록 (visibilitychange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    console.log('[IdleTimeout] Initialized for', isMobile ? 'mobile' : 'desktop', 'with events:', windowEvents)

    // 컴포넌트 언마운트 또는 경로 변경 시 클린업
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      
      // Window 이벤트 제거
      windowEvents.forEach((event) => {
        window.removeEventListener(event as keyof WindowEventMap, handleActivity)
      })
      
      // Document 이벤트 제거
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [resetTimer, pathname, isMobile]) // 경로가 변경될 때마다 이펙트를 재실행하여 타이머 로직을 재평가

  return null // 이 컴포넌트는 UI를 렌더링하지 않음
}

export default IdleTimeoutHandler 