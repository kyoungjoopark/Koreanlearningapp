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
    <header className="p-3 bg-gray-100 dark:bg-gray-800 border-b">
      <div className="flex items-center justify-center gap-8 px-4">
        {/* Left: Home Link */}
        <Link href="/" className="text-base md:text-lg font-bold text-gray-800 dark:text-white flex-shrink-0">
          <span className="hidden sm:inline">Korean Learning App</span>
          <span className="sm:hidden">KLA</span>
        </Link>

        {/* Right: User Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-blue-600 text-xs font-semibold text-white rounded hover:bg-blue-700 transition-colors"
            >
              Logout
            </button>
          ) : !isAuthPage && (
            <Link
              href="/auth"
              className="px-3 py-1.5 bg-blue-600 text-xs font-semibold text-white rounded hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
} 