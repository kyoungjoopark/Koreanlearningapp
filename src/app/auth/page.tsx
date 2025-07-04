'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signUp, isTeacher } from '@/lib/auth'
import Image from 'next/image'
import boyGirlImage from '@/assets/boy_girl.png' // 이미지를 직접 import 합니다.

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [nickname, setNickname] = useState('')
  const [nationality, setNationality] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const confirmedParam = searchParams.get('confirmed');
    
    if (errorParam === 'inactive_account') {
      setError('비활성화된 계정입니다. 관리자에게 문의하세요.');
    } else if (confirmedParam === 'true') {
      setSuccess('이메일 인증이 완료되었습니다! 이제 로그인해주세요.');
      setIsLogin(true); // 로그인 모드로 전환
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
        
        // 로그인 성공 후 약간의 지연을 두고 리다이렉트
        setTimeout(() => {
          const next = searchParams.get('next')
          
          // 관리자인지 확인 후 리디렉션
          if (user && isTeacher(user)) {
            window.location.href = '/teacher-dashboard';
          } else {
            window.location.href = next || '/';
          }
        }, 1000); // 1초 후 리다이렉트
        
      } catch (err: any) {
        setError(err.message || '로그인 중 오류가 발생했습니다.')
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

        const result = await signUp({ email, password, fullname, nickname, nationality })
        
        // API에서 받은 실제 메시지를 표시합니다.
        setSuccess(result.message || '가입 확인을 위해 이메일을 확인해주세요.')
        setSignupSuccess(true); // 회원가입 성공 화면으로 전환
        
        // 로딩 상태만 해제
        setLoading(false)

      } catch (err: any) {
        setError(err.message || '회원가입 중 오류가 발생했습니다.')
        setLoading(false)
      }
    }
  }

  const resetForms = () => {
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullname('')
    setNickname('')
    setNationality('')
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
          {!signupSuccess && isLogin && (
            <div className="text-center mb-6 p-4 bg-sky-50 rounded-lg border border-sky-100">
              <p className="text-sky-700 leading-relaxed">
                개인 맞춤형 한국어 학습에 오신 것을 환영합니다! AI와 한국인 선생님과 함께 여러분의 모험을 시작하세요.
              </p>
              <p className="text-sky-800 leading-relaxed mt-2">
                Welcome to your personalized Korean language learning journey! Start your adventure with our AI and expert Korean teachers.
              </p>
            </div>
          )}
          {!signupSuccess && !isLogin && (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-korean-800 mb-2">
                회원가입
              </h1>
              <h2 className="text-lg text-korean-600">
                Sign Up
              </h2>
            </div>
          )}

          {/* 오류 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <div className="font-medium">{error}</div>
            </div>
          )}
          
          {/* 로그인 성공 메시지 */}
          {success && isLogin && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              <div className="font-medium">{success}</div>
            </div>
          )}

          {signupSuccess ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <h3 className="text-lg font-bold mb-2">가입 신청 완료!</h3>
                <p>{success}</p>
                <p className="mt-2 text-sm">받은편지함과 스팸함을 모두 확인해주세요.</p>
              </div>
              <button
                onClick={() => {
                  setIsLogin(true);
                  setSignupSuccess(false);
                  resetForms();
                }}
                className="btn-primary w-full"
              >
                로그인 화면으로 가기
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
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
                        placeholder="닉네임을 입력하세요 (Enter your nickname)"
                        required={!isLogin}
                      />
                    </div>

                    <div>
                      <label htmlFor="nationality" className="block text-sm font-medium text-korean-700 mb-2">
                        국적 <span className="text-korean-500">(Nationality)</span>
                      </label>
                      <select
                        id="nationality"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="input-field bg-white"
                        required={!isLogin}
                      >
                        <option value="">국적을 선택하세요 (Select your nationality)</option>
                        <option value="Korea">Korea (한국)</option>
                        <option value="China">China (중국)</option>
                        <option value="Japan">Japan (일본)</option>
                        <option value="USA">USA (미국)</option>
                        <option value="Canada">Canada (캐나다)</option>
                        <option value="Australia">Australia (호주)</option>
                        <option value="UK">UK (영국)</option>
                        <option value="Germany">Germany (독일)</option>
                        <option value="France">France (프랑스)</option>
                        <option value="Spain">Spain (스페인)</option>
                        <option value="Italy">Italy (이탈리아)</option>
                        <option value="Russia">Russia (러시아)</option>
                        <option value="Brazil">Brazil (브라질)</option>
                        <option value="Mexico">Mexico (멕시코)</option>
                        <option value="India">India (인도)</option>
                        <option value="Thailand">Thailand (태국)</option>
                        <option value="Vietnam">Vietnam (베트남)</option>
                        <option value="Philippines">Philippines (필리핀)</option>
                        <option value="Indonesia">Indonesia (인도네시아)</option>
                        <option value="Malaysia">Malaysia (말레이시아)</option>
                        <option value="Singapore">Singapore (싱가포르)</option>
                        <option value="Other">Other (기타)</option>
                      </select>
                    </div>
                  </>
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
                    placeholder="이메일을 입력하세요 (Enter your email)"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-korean-700 mb-2">
                    비밀번호 <span className="text-korean-500">(Password)</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder={isLogin ? "비밀번호를 입력하세요 (Enter password)" : "비밀번호를 입력하세요 (최소 6자) (Enter password, min 6 chars)"}
                    required
                    disabled={loading}
                    minLength={isLogin ? undefined : 6}
                  />
                </div>
                
                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-korean-700 mb-2">
                      비밀번호 확인 <span className="text-korean-500">(Confirm Password)</span>
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      placeholder="비밀번호를 다시 입력하세요 (Re-enter password)"
                      required={!isLogin}
                      disabled={loading}
                    />
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      처리중... <span className="text-korean-300">(Processing...)</span>
                    </span>
                  ) : (
                    isLogin ? '로그인 (Login)' : '회원가입 (Sign Up)'
                  )}
                </button>
              </form>
          
              <div className="mt-6 text-center">
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    resetForms();
                  }}
                  className="text-sm font-medium text-korean-600 hover:text-korean-800"
                  disabled={loading}
                >
                  {isLogin ? (
                    <span>
                      계정이 없으신가요? <span className="font-bold underline">회원가입</span>
                      <br/>
                      <span className="text-korean-500">Don't have an account? Sign up</span>
                    </span>
                  ) : (
                    <span>
                      이미 계정이 있으신가요? <span className="font-bold underline">로그인</span>
                      <br/>
                      <span className="text-korean-500">Already have an account? Login</span>
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
} 