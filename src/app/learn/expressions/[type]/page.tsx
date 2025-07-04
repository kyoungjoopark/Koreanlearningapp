'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Book, Feather, ChevronRight } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Image from 'next/image'

const idiomLevels = [
  { name: '초급', description: '사용 빈도가 낮은 관용구를 배워보세요.' },
  { name: '중급', description: '사용 빈도가 보통인 관용구를 학습합니다.' },
  { name: '고급', description: '사용 빈도가 높은 관용구를 익힙니다.' },
  { name: '전체', description: '모든 관용구를 학습합니다.', level: 'all' },
];

const levelDisplayNames: { [key: string]: string } = {
  '초급': '빈도 낮음',
  '중급': '빈도 보통',
  '고급': '빈도 높음',
  '전체': '전체'
};

const levelImages: { [key: string]: string } = {
  '초급': '/assets/low.png',
  '중급': '/assets/mid.png',
  '고급': '/assets/high.png'
};

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

        <div className={`grid gap-6 ${type === 'idioms' ? 'grid-cols-1 max-w-4xl mx-auto' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7'}`}>
          {config.options.map((option) => (
             <div 
              key={option.name} 
              onClick={() => handleSelect(option.name)}
              className={`cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group text-center flex items-center transform hover:-translate-y-1 ${
                type === 'idioms' ? 'p-8 min-h-[128px] mb-3' : 'p-4 flex-col justify-center'
              }`}
            >
              {type === 'idioms' && levelImages[option.name] ? (
                <div className="w-24 h-24 flex items-center justify-center mr-10">
                  <Image
                    src={levelImages[option.name]}
                    alt={`${levelDisplayNames[option.name]} 캐릭터`}
                    width={90}
                    height={90}
                    className="rounded-2xl object-cover"
                  />
                </div>
              ) : null}
              <div className={type === 'idioms' ? 'flex-1' : ''}>
                <h2 className={`font-bold text-korean-800 ${type === 'idioms' ? 'text-2xl mb-1' : 'text-xl'}`}>
                  {type === 'idioms' ? (levelDisplayNames[option.name] || option.name) : option.name}
                </h2>
                {type === 'idioms' && <p className="text-lg text-gray-500">{option.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 