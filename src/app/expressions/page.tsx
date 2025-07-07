'use client'

import Link from 'next/link'
import { Book, Feather, ArrowLeft } from 'lucide-react'

const expressionTypes = [
  {
    name: '관용구',
    description: '일상 대화에서 자주 쓰이는 관용적인 표현을 배워보세요.',
    href: '/learn/idioms',
    Icon: Book,
  },
  {
    name: '속담',
    description: '지혜와 교훈이 담긴 한국의 속담을 학습해보세요.',
    href: '/learn/expressions/proverbs',
    Icon: Feather,
  },
]

export default function ExpressionsPage() {
  return (
    <div className="min-h-screen bg-korean-50">
      <div className="w-full max-w-5xl mx-auto p-8">

        <div className="mb-8">
          <Link href="/" className="flex items-center text-lg text-gray-700 hover:text-korean-600 font-semibold transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            홈으로 돌아가기
          </Link>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-2xl sm:text-3xl font-bold text-korean-800">관용구 및 속담 학습</h1>
          <p className="mt-2 text-base sm:text-lg text-gray-600">학습하고 싶은 종류를 선택하세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {expressionTypes.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className="block p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 group"
            >
              <div className="flex items-center mb-4">
                <item.Icon className="w-6 h-6 sm:w-8 sm:h-8 text-korean-500" />
                <h2 className="ml-4 text-lg sm:text-xl font-bold text-korean-800">{item.name}</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-6">{item.description}</p>
              <span className="font-semibold text-korean-600 group-hover:text-korean-700">
                학습 시작하기 &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 