'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      // 가입 성공 시 처리 (예: 확인 이메일 안내)
      alert('가입 확인 이메일을 확인해주세요.');
    }
    setIsSubmitting(false);
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setIsSubmitting(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form className="flex flex-col w-full max-w-sm p-8 space-y-4 bg-white rounded-lg shadow-lg">
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="p-2 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="p-2 border rounded"
          required
        />
        <button onClick={handleSignIn} disabled={isSubmitting} className="p-2 text-white bg-blue-500 rounded disabled:bg-gray-400">
          {isSubmitting ? '처리 중...' : '로그인'}
        </button>
        <button onClick={handleSignUp} disabled={isSubmitting} className="p-2 text-white bg-green-500 rounded disabled:bg-gray-400">
          {isSubmitting ? '처리 중...' : '회원가입'}
        </button>
      </form>
    </div>
  )
} 