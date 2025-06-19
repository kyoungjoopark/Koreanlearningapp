'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth'
import Image from 'next/image'
import boyGirlImage from '@/assets/boy_girl.png'

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [nationality, setNationality] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'inactive_account') {
      setError('비활성화된 계정입니다. 관리자에게 문의하세요.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (isLogin) {
      try {
        const { user } = await signIn({ email, password })
        setSuccess('로그인 성공! 페이지를 이동합니다...')
        router.refresh()
        
        const next = searchParams.get('next')

        // 관리자인지 확인 후 리디렉션
        if (user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
          router.push('/teacher-dashboard');
        } else {
          router.push(next || '/');
        }
      } catch (err: any) {
        setError(err.message || '로그인 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    } else {
      // 회원가입 처리
      try {
        if (password !== confirmPassword) {
          throw new Error('비밀번호가 일치하지 않습니다.')
        }

        if (password.length < 6) {
          throw new Error('비밀번호는 최소 6자 이상이어야 합니다.')
        }

        await signUp({ email, password, fullname, nationality, nickname })
        
        setSuccess('회원가입 성공! 잠시 후 로그인 폼으로 이동합니다. 다시 로그인해주세요.')
        setTimeout(() => {
          setIsLogin(true)
          setSuccess('')
          setError('')
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setFullname('')
          setNationality('')
          setNickname('')
          setLoading(false)
        }, 2000)
      } catch (err: any) {
        setError(err.message || '회원가입 중 오류가 발생했습니다.')
        setLoading(false)
      }
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* src 폴더에서 직접 불러온 이미지를 사용합니다. */}
        <div className="text-center mb-8">
          <Image
            src={boyGirlImage} // import한 이미지 변수를 src에 전달합니다.
            alt="KJ's Korean Learning"
            width={256}
            height={256}
            className="mx-auto rounded-full object-cover w-48 h-48 md:w-56 md:h-56 border-4 border-white shadow-xl"
            priority
            placeholder="blur" // 이미지가 로드되는 동안 흐린 효과를 줍니다.
          />
        </div>
        
        <div className="card">
          {isLogin ? (
            <div className="text-center mb-6 p-4 bg-sky-50 rounded-lg border border-sky-100">
              <p className="text-sky-700 leading-relaxed">
                개인 맞춤형 한국어 학습에 오신 것을 환영합니다! AI와 한국인 선생님과 함께 여러분의 모험을 시작하세요.
              </p>
              <p className="text-sky-800 leading-relaxed mt-2">
                Welcome to your personalized Korean language learning journey! Start your adventure with our AI and expert Korean teachers.
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-korean-800 mb-2">
                회원가입
              </h1>
              <h2 className="text-lg text-korean-600">
                Sign Up
              </h2>
            </div>
          )}

          {/* 오류/성공 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <div className="font-medium">{error}</div>
              {error.includes('비밀번호가 일치하지') && (
                <div className="text-sm mt-1">Passwords do not match</div>
              )}
              {error.includes('비밀번호는 최소') && (
                <div className="text-sm mt-1">Password must be at least 6 characters</div>
              )}
              {error.includes('처리 중 오류') && (
                <div className="text-sm mt-1">An error occurred during processing</div>
              )}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              <div className="font-medium">{success}</div>
              {success.includes('회원가입 성공! 로그인되었습니다') && (
                <div className="text-sm mt-1">Sign up successful! You are now logged in</div>
              )}
              {success.includes('회원가입 성공! 바로 로그인') && (
                <div className="text-sm mt-1">Sign up successful! You can now log in</div>
              )}
              {success.includes('로그인 성공') && (
                <div className="text-sm mt-1">Login successful!</div>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="fullname" className="block text-sm font-medium text-korean-700 mb-2">
                  이름 <span className="text-korean-500">(Full Name)</span>
                </label>
                <input
                  type="text"
                  id="fullname"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="input-field"
                  placeholder="이름을 입력하세요 (Enter your full name)"
                  required={!isLogin}
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-korean-700 mb-2">
                  국적 <span className="text-korean-500">(Nationality)</span>
                </label>
                <input
                  type="text"
                  id="nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="input-field"
                  placeholder="국적을 입력하세요 (Enter your nationality)"
                  required={!isLogin}
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-korean-700 mb-2">
                  닉네임 <span className="text-korean-500">(Nickname)</span>
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="input-field"
                  placeholder="닉네임을 입력하세요 (Enter a nickname)"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-korean-700 mb-2">
                이메일 <span className="text-korean-500">(Email)</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-korean-700 mb-2"
              >
                비밀번호 <span className="text-korean-500">(Password)</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-korean-700 mb-2"
                >
                  비밀번호 확인 <span className="text-korean-500">(Confirm Password)</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required={!isLogin}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:bg-korean-400"
            >
              {loading
                ? '처리 중...'
                : isLogin
                ? '로그인 (Login)'
                : '회원가입 (Sign Up)'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-korean-600 hover:underline"
            >
              {isLogin
                ? '계정이 없으신가요? 회원가입'
                : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-korean-600 hover:underline">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
} 