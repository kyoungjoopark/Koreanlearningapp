'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@supabase/supabase-js'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireTeacher?: boolean
}

export default function ProtectedRoute({ children, requireTeacher = false }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
          router.push('/auth')
          return
        }

        // 선생님 권한이 필요한 페이지 체크
        if (requireTeacher && currentUser.email !== 'kpark71@hanmail.net') {
          router.push('/')
          return
        }

        setUser(currentUser)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, requireTeacher])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-korean-600 mx-auto mb-4"></div>
          <p className="text-korean-600 text-lg">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // 리다이렉트 중이므로 아무것도 렌더링하지 않음
  }

  return <>{children}</>
} 