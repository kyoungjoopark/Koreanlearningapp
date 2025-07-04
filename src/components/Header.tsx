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
    <header className="p-4 bg-gray-100 dark:bg-gray-800 border-b">
      <div className="max-w-5xl mx-auto grid grid-cols-3 items-center px-4 md:px-10">
        {/* Left Spacer */}
        <div />

        {/* Centered Title */}
        <div className="flex items-center justify-center gap-3 text-center">
          <Link href="/" className="text-lg font-bold text-gray-800 dark:text-white whitespace-nowrap">
            Korean Learning App
          </Link>
          {user && (
            <button
              onClick={handleLogout}
              className="px-2 py-1 bg-gray-200 text-xs font-semibold text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          )}
        </div>

        {/* Right Aligned Buttons */}
        <div className="flex justify-end">
          {!user && !isAuthPage && (
            <Link
              href="/auth"
              className="px-4 py-2 bg-korean-600 text-sm font-semibold text-white rounded-md hover:bg-korean-700 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
} 