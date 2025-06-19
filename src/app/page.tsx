'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, Edit3, BookOpen, User, Shield, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { type User as SupabaseUser } from '@supabase/supabase-js'
import Image from 'next/image'
import qaImage from '@/assets/QA.png'
import practiceImage from '@/assets/practice.png'
import idiomsImage from '@/assets/idioms.png'
import myPageImage from '@/assets/mypage.png'

const LangAppLogo = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-korean-700">
    <g clipPath="url(#clip0_page_logo)">
      <path
        d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z"
        fill="currentColor"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.24189 26.4066C7.31369 26.4411 7.64204 26.5637 8.52504 26.3738C9.59462 26.1438 11.0343 25.5311 12.7183 24.4963C14.7583 23.2426 17.0256 21.4503 19.238 19.238C21.4503 17.0256 23.2426 14.7583 24.4963 12.7183C25.5311 11.0343 26.1438 9.59463 26.3738 8.52504C26.5637 7.64204 26.4411 7.31369 26.4066 7.24189C26.345 7.21246 26.143 7.14535 25.6664 7.1918C24.9745 7.25925 23.9954 7.5498 22.7699 8.14278C20.3369 9.32007 17.3369 11.4915 14.4142 14.4142C11.4915 17.3369 9.32007 20.3369 8.14278 22.7699C7.5498 23.9954 7.25925 24.9745 7.1918 25.6664C7.14534 26.143 7.21246 26.345 7.24189 26.4066ZM29.9001 10.7285C29.4519 12.0322 28.7617 13.4172 27.9042 14.8126C26.465 17.1544 24.4686 19.6641 22.0664 22.0664C19.6641 24.4686 17.1544 26.465 14.8126 27.9042C13.4172 28.7617 12.0322 29.4519 10.7285 29.9001L21.5754 40.747C21.6001 40.7606 21.8995 40.931 22.8729 40.7217C23.9424 40.4916 25.3821 39.879 27.0661 38.8441C29.1062 37.5904 31.3734 35.7982 33.5858 33.5858C35.7982 31.3734 37.5904 29.1062 38.8441 27.0661C39.879 25.3821 40.4916 23.9425 40.7216 22.8729C40.931 21.8995 40.7606 21.6001 40.747 21.5754L29.9001 10.7285ZM29.2403 4.41187L43.5881 18.7597C44.9757 20.1473 44.9743 22.1235 44.6322 23.7139C44.2714 25.3919 43.4158 27.2666 42.252 29.1604C40.8128 31.5022 38.8165 34.012 36.4142 36.4142C34.012 38.8165 31.5022 40.8128 29.1604 42.252C27.2666 43.4158 25.3919 44.2714 23.7139 44.6322C22.1235 44.9743 20.1473 44.9757 18.7597 43.5881L4.41187 29.2403C3.29027 28.1187 3.08209 26.5973 3.21067 25.2783C3.34099 23.9415 3.8369 22.4852 4.54214 21.0277C5.96129 18.0948 8.43335 14.7382 11.5858 11.5858C14.7382 8.43335 18.0948 5.9613 21.0277 4.54214C22.4852 3.8369 23.9415 3.34099 25.2783 3.21067C26.5973 3.08209 28.1187 3.29028 29.2403 4.41187Z"
        fill="currentColor"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_page_logo"><rect width="48" height="48" fill="white"></rect></clipPath>
    </defs>
  </svg>
)

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh() // 미들웨어가 /auth로 리다이렉트 처리
  }
  
  const features = [
    { koreanName: '한국어 질문과 답변', englishName: 'Korean Q&A', href: '/korean-qa', image: qaImage, description: 'AI 선생님과 실시간으로 질문하고 답변 받으세요.' },
    { koreanName: '한국어 학습', englishName: 'Korean Practice', href: '/courses', image: practiceImage, description: '듣기, 말하기, 쓰기 등 다양한 연습을 해보세요.' },
    { koreanName: '관용구 및 속담', englishName: 'Expressions & Proverbs', href: '/expressions', image: idiomsImage, description: '관용구와 속담을 배우고 퀴즈를 풀어보세요.' },
    { koreanName: '마이 페이지', englishName: 'My Page', href: '/my-page', image: myPageImage, description: '나의 학습 현황과 정보를 확인하세요.', icon: User },
  ]

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kpark71@hanmail.net'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-korean-600 text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-korean-50 to-korean-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* 삭제 시작: 이 페이지의 자체 헤더를 삭제합니다. 공통 헤더가 이 역할을 대신합니다. */}
        {/* 
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-gray-200 px-4 md:px-10 py-3 mb-10">
          <div className="flex items-center gap-4 text-korean-700">
            <LangAppLogo />
            <h2 className="text-xl font-bold tracking-tight">LangApp</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.user_metadata?.nickname || user?.email}
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md bg-korean-100 px-4 py-2 text-sm text-korean-700 transition-colors hover:bg-korean-200"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        </header>
        */}
        {/* 삭제 끝 */}
        
        {/* 본문 콘텐츠 */}
        <div className="px-4 md:px-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            안녕하세요, {user?.user_metadata?.nickname || user?.email?.split('@')[0]}님!
          </h1>
          <p className="text-gray-600 mb-12">무엇을 학습해볼까요?</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Link key={feature.koreanName} href={feature.href}>
                <div className="group flex items-center gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-korean-300 hover:bg-korean-50">
                  {/* 아이콘 대신 이미지를 표시하는 로직 */}
                  {feature.image ? (
                    <div className="w-20 h-20 flex-shrink-0">
                      <Image
                        src={feature.image}
                        alt={feature.koreanName}
                        className="w-full h-full object-cover rounded-lg shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg bg-korean-100 p-3 text-korean-600 transition-colors group-hover:bg-korean-200">
                      {feature.icon && <feature.icon size={24} />}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-lg text-gray-800">{feature.koreanName}</p>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {user?.email === ADMIN_EMAIL && (
            <div className="mt-12">
              <Link href="/teacher-dashboard">
                <div className="group flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm transition-all hover:border-red-400">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-red-100 p-2 text-red-600">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-red-700">관리자 페이지</p>
                      <p className="text-sm text-red-600">사용자 및 학습 데이터를 관리합니다.</p>
                    </div>
                  </div>
                  <LogOut size={20} className="text-red-400 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
        </div>
          )}
        </div>
      </div>
    </main>
  )
} 