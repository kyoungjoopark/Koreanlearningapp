'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    
    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // 현재 경로 확인
  const pathname = usePathname()
  const isAuthPage = pathname === '/auth'

  return (
    <header className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 border-b gap-6">
      <Link href="/" className="text-xl font-bold">
        Korean Learning App
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              안녕하세요, {user.email?.split('@')[0] || '사용자'}님!
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          // auth 페이지에서는 Login 버튼을 보여주지 않음
          !isAuthPage && (
            <Link
              href="/auth"
              className="px-4 py-2 bg-korean-600 text-sm font-semibold text-white rounded-md hover:bg-korean-700 transition-colors"
            >
              Login
            </Link>
          )
        )}
      </div>
    </header>
  )
} 