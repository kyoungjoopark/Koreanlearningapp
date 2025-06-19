'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import TTSButton from '@/components/TTSButton'

type Level = '초급 1' | '초급 2' | '중급 1' | '중급 2' | '고급 1' | '고급 2'

interface Word {
  id: number
  korean: string
  meaning: string
  pronunciation: string
  example: string
  level: Level
}

export default function VocabularyPage() {
  const [selectedLevel, setSelectedLevel] = useState<Level>('초급 1')
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)

  const levels: Level[] = ['초급 1', '초급 2', '중급 1', '중급 2', '고급 1', '고급 2']

  // 예시 단어 데이터
  const vocabularyData: Record<Level, Word[]> = {
    '초급 1': [
      {
        id: 1,
        korean: '안녕하세요',
        meaning: 'Hello (formal)',
        pronunciation: 'an-nyeong-ha-se-yo',
        example: '안녕하세요, 만나서 반갑습니다.',
        level: '초급 1'
      },
      {
        id: 2,
        korean: '감사합니다',
        meaning: 'Thank you',
        pronunciation: 'gam-sa-ham-ni-da',
        example: '도와주셔서 감사합니다.',
        level: '초급 1'
      },
    ],
    '초급 2': [
      {
        id: 3,
        korean: '학교',
        meaning: 'School',
        pronunciation: 'hak-gyo',
        example: '저는 학교에 갑니다.',
        level: '초급 2'
      }
    ],
    '중급 1': [
      {
        id: 4,
        korean: '경험',
        meaning: 'Experience',
        pronunciation: 'gyeong-heom',
        example: '좋은 경험이었습니다.',
        level: '중급 1'
      }
    ],
    '중급 2': [
      {
        id: 5,
        korean: '즐겁다',
        meaning: 'To be fun/enjoyable',
        pronunciation: 'jeul-geop-da',
        example: '오늘 정말 즐거웠어요.',
        level: '중급 2'
      }
    ],
    '고급 1': [
      {
        id: 6,
        korean: '지속가능하다',
        meaning: 'To be sustainable',
        pronunciation: 'ji-sok-ga-neung-ha-da',
        example: '지속가능한 발전이 중요합니다.',
        level: '고급 1'
      }
    ],
    '고급 2': [
      {
        id: 7,
        korean: '창의적',
        meaning: 'Creative',
        pronunciation: 'chang-ui-jeok',
        example: '창의적인 생각이 필요합니다.',
        level: '고급 2'
      }
    ]
  }

  const currentWords = vocabularyData[selectedLevel]
  const currentWord = currentWords[currentWordIndex]

  // 학습 기록 (예시 데이터)
  const learningHistory = [
    { id: 1, level: '중급 1', wordCount: 25, score: 88, date: '2024-01-20' },
    { id: 2, level: '초급 1', wordCount: 30, score: 95, date: '2024-01-19' },
    { id: 3, level: '고급 2', wordCount: 20, score: 82, date: '2024-01-18' },
    { id: 4, level: '중급 2', wordCount: 15, score: 90, date: '2024-01-17' },
  ]

  const nextWord = () => {
    setCurrentWordIndex((prev) => 
      prev < currentWords.length - 1 ? prev + 1 : 0
    )
    setShowMeaning(false)
  }

  const prevWord = () => {
    setCurrentWordIndex((prev) => 
      prev > 0 ? prev - 1 : currentWords.length - 1
    )
    setShowMeaning(false)
  }

  const handleLevelChange = (level: Level) => {
    setSelectedLevel(level)
    setCurrentWordIndex(0)
    setShowMeaning(false)
  }

  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-8">
        <Link href="/" className="text-korean-600 hover:text-korean-800 mb-6 inline-block">
          ← 홈으로 돌아가기
        </Link>
        
        <h1 className="text-3xl font-bold text-korean-800 mb-8">단어 학습</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 단어 학습 영역 */}
          <div className="lg:col-span-2">
            {/* 레벨 선택 */}
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-korean-800 mb-4">레벨 선택</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => handleLevelChange(level)}
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
            
            {/* 단어 카드 */}
            {currentWord && (
              <div className="card">
                <div className="text-center mb-4">
                  <span className="text-sm text-korean-500">
                    {currentWordIndex + 1} / {currentWords.length}
                  </span>
                </div>
                
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <h2 className="text-4xl font-bold text-korean-800">
                      {currentWord.korean}
                    </h2>
                    <TTSButton text={currentWord.korean} size="lg" />
                  </div>
                  <p className="text-lg text-korean-600 mb-2">
                    [{currentWord.pronunciation}]
                  </p>
                  
                  {showMeaning && (
                    <div className="mt-6 p-4 bg-korean-50 rounded-lg">
                      <p className="text-xl font-medium text-korean-800 mb-2">
                        {currentWord.meaning}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-korean-600 italic">
                          "{currentWord.example}"
                        </p>
                        <TTSButton text={currentWord.example} size="sm" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={() => setShowMeaning(!showMeaning)}
                    className="btn-primary"
                  >
                    {showMeaning ? '뜻 숨기기' : '뜻 보기'}
                  </button>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={prevWord}
                    className="btn-secondary"
                  >
                    ← 이전
                  </button>
                  <button
                    onClick={nextWord}
                    className="btn-secondary"
                  >
                    다음 →
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* 학습 기록 */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-semibold text-korean-800 mb-4">학습 기록</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {learningHistory.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 border border-korean-200 rounded-lg hover:bg-korean-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-medium text-korean-800">
                        {record.level} 단어학습
                      </h3>
                      <span className="text-sm font-medium text-korean-700">
                        {record.score}점
                      </span>
                    </div>
                    <p className="text-xs text-korean-600 mb-1">
                      {record.wordCount}개 단어 학습
                    </p>
                    <p className="text-xs text-korean-500">{record.date}</p>
                  </div>
                ))}
              </div>
              <Link href="/my-page" className="btn-secondary w-full mt-4">
                학습 로그 보기
              </Link>
            </div>
            
            {/* 학습 팁 */}
            <div className="card mt-6">
              <h2 className="text-lg font-semibold text-korean-800 mb-4">학습 팁</h2>
              <div className="space-y-3 text-sm text-korean-600">
                <p>💡 단어를 소리내어 읽어보세요</p>
                <p>✍️ 예문을 따라 써보세요</p>
                <p>🔄 반복 학습이 중요합니다</p>
                <p>📝 모르는 단어는 따로 정리하세요</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
} 