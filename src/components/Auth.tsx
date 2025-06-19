import { useState } from 'react'
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabase } from '@/lib/supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState('sign-in')

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      alert(error.message)
    } else {
      alert('이메일을 확인해주세요!')
    }
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <div className="flex flex-col space-y-4">
        {view === 'sign-in' ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-4">로그인</h1>
            <form onSubmit={handleSignIn} className="flex flex-col space-y-4">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? '처리중...' : '로그인'}
              </button>
            </form>
            <p className="text-center text-sm">
              계정이 없으신가요?{' '}
              <button
                className="text-korean-600 hover:text-korean-800 font-medium"
                onClick={() => setView('sign-up')}
              >
                회원가입
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-4">회원가입</h1>
            <form onSubmit={handleSignUp} className="flex flex-col space-y-4">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? '처리중...' : '회원가입'}
              </button>
            </form>
            <p className="text-center text-sm">
              이미 계정이 있으신가요?{' '}
              <button
                className="text-korean-600 hover:text-korean-800 font-medium"
                onClick={() => setView('sign-in')}
              >
                로그인
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
} 