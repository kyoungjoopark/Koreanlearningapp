'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Book, Feather, ChevronRight } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import IdiomsClientPage from './[level]/IdiomsClientPage'

const idiomLevels = [
  { name: '초급', description: '기초적인 관용구를 배워보세요.' },
  { name: '중급', description: '일상 대화에 유용한 관용구를 학습합니다.' },
  { name: '고급', description: '심화된 표현력를 위한 관용구를 익힙니다.' },
  { name: '전체', description: '모든 관용구를 학습합니다.', level: 'all' },
];

const proverbConsonants = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', '전체'
];

export default function ExpressionTypePage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as string;

  const pageConfig = {
    idioms: {
      title: '관용구',
      description: '학습할 레벨을 선택하세요.',
      Icon: Book,
      options: idiomLevels,
      basePath: '/learn/expressions/idioms'
    },
    proverbs: {
      title: '속담',
      description: '학습할 자음을 선택하세요.',
      Icon: Feather,
      options: proverbConsonants.map(c => ({ name: c, description: `${c}으로 시작하는 속담` })),
      basePath: '/learn/expressions/proverbs'
    }
  }

  const config = pageConfig[type as keyof typeof pageConfig];

  if (!config) {
    // 404 페이지나 리다이렉션 처리
    return <div className="text-center p-8">잘못된 접근입니다.</div>
  }

  const handleSelect = (option: string) => {
    const level = type === 'idioms' && option === '전체' ? 'all' : option;
    const path = `${config.basePath}/${encodeURIComponent(level)}`;
    router.push(path);
  }

  return (
    <div className="min-h-screen bg-korean-50">
      <div className="w-full max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <Link href="/expressions" className="flex items-center text-lg text-gray-700 hover:text-korean-600 font-semibold transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            종류 선택으로 돌아가기
          </Link>
        </div>
        
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4">
            <config.Icon className="w-10 h-10 text-korean-500" />
            <h1 className="text-4xl font-bold text-korean-800">{config.title} 학습</h1>
          </div>
          <p className="mt-2 text-lg text-gray-600">{config.description}</p>
        </div>

        <div className={`grid gap-6 ${type === 'idioms' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7'}`}>
          {config.options.map((option) => (
             <div 
              key={option.name} 
              onClick={() => handleSelect(option.name)}
              className="cursor-pointer p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group text-center flex flex-col justify-center items-center transform hover:-translate-y-1"
            >
              <h2 className="text-xl font-bold text-korean-800">{option.name}</h2>
              {type === 'idioms' && <p className="text-sm text-gray-500 mt-1">{option.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 