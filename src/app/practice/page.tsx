'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'

type Level = '초급 1' | '초급 2' | '중급 1' | '중급 2' | '고급 1' | '고급 2'
type PracticeType = '듣기' | '말하기' | '대화완성' | '번역'

export default function PracticePage() {
  const [selectedLevel, setSelectedLevel] = useState<Level>('초급 1')
  const [selectedType, setSelectedType] = useState<PracticeType>('듣기')

  const levels: Level[] = ['초급 1', '초급 2', '중급 1', '중급 2', '고급 1', '고급 2']
  const practiceTypes: PracticeType[] = ['듣기', '말하기', '대화완성', '번역']

  // 연습 기록 (예시 데이터)
  const practiceHistory = [
    { id: 1, type: '듣기', level: '중급 1', topic: '쇼핑하기', score: 85, date: '2024-01-20' },
    { id: 2, type: '번역', level: '초급 1', topic: '자기소개', score: 92, date: '2024-01-19' },
    { id: 3, type: '대화완성', level: '중급 2', topic: '병원 가기', score: 78, date: '2024-01-18' },
    { id: 4, type: '말하기', level: '고급 2', topic: '날씨 이야기', score: 88, date: '2024-01-17' },
  ]

  const startPractice = () => {
    // TODO: 실제 연습 로직 구현
    alert(`${selectedLevel} ${selectedType} 연습을 시작합니다!`)
  }

  return (
    <ProtectedRoute>
    <main className="container mx-auto px-4 py-8">
      <Link href="/" className="text-korean-600 hover:text-korean-800 mb-6 inline-block">
        ← 홈으로 돌아가기
      </Link>
      
      <h1 className="text-3xl font-bold text-korean-800 mb-8">한국어 연습</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 연습 설정 */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-korean-800 mb-4">연습 선택</h2>
            
            {/* 레벨 선택 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-korean-700 mb-3">레벨</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedLevel === level
                        ? 'bg-korean-500 text-white border-korean-500'
                        : 'bg-white text-korean-700 border-korean-200 hover:bg-korean-50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 연습 타입 선택 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-korean-700 mb-3">연습 유형</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {practiceTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedType === type
                        ? 'bg-korean-500 text-white border-korean-500'
                        : 'bg-white text-korean-700 border-korean-200 hover:bg-korean-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={startPractice}
              className="btn-primary w-full text-lg py-3"
            >
              {selectedLevel} {selectedType} 연습 시작하기
            </button>
          </div>
          
          {/* 연습 설명 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-korean-800 mb-4">연습 설명</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-korean-700">듣기 연습</h3>
                <p className="text-sm text-korean-600">한국어 음성을 듣고 내용을 이해하는 연습</p>
              </div>
              <div>
                <h3 className="font-medium text-korean-700">말하기 연습</h3>
                <p className="text-sm text-korean-600">주어진 상황에 맞는 한국어 말하기 연습</p>
              </div>
              <div>
                <h3 className="font-medium text-korean-700">대화완성 연습</h3>
                <p className="text-sm text-korean-600">빈칸을 채워 자연스러운 대화 완성하기</p>
              </div>
              <div>
                <h3 className="font-medium text-korean-700">번역 연습</h3>
                <p className="text-sm text-korean-600">한국어와 다른 언어 간의 번역 연습</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 연습 기록 */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-korean-800 mb-4">연습 기록</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {practiceHistory.map((practice) => (
                <div
                  key={practice.id}
                  className="p-3 border border-korean-200 rounded-lg hover:bg-korean-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-medium text-korean-800">
                      {practice.type} ({practice.level})
                    </h3>
                    <span className="text-sm font-medium text-korean-700">
                      {practice.score}점
                    </span>
                  </div>
                  <p className="text-xs text-korean-600 mb-1">{practice.topic}</p>
                  <p className="text-xs text-korean-500">{practice.date}</p>
                </div>
              ))}
            </div>
            <Link href="/my-page" className="btn-secondary w-full mt-4">
              학습 로그 보기
            </Link>
          </div>
        </div>
      </div>
    </main>
    </ProtectedRoute>
  )
} 