'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface Idiom {
  id: number;
  expression: string | null;
  meaning: string | null;
  meaning_en: string | null;
  example_sentence: string | null;
  example_sentence_en: string | null;
  explanation: string | null;
  situation: string | null;
  level: string | null;
}

interface IdiomsClientPageProps {
  idioms: Idiom[];
  level: string;
}

export default function IdiomsClientPage({ idioms, level }: IdiomsClientPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % idioms.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + idioms.length) % idioms.length);
  };

  const currentIdiom = idioms[currentIndex];

  return (
    <div className="min-h-screen bg-korean-50 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <Link href="/learn/idioms" className="flex items-center text-korean-700 hover:text-korean-800 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              레벨 선택으로 돌아가기
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-lg text-korean-600">관용구 학습 ({level} 레벨)</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-4xl font-bold text-center text-korean-800 mb-8">
              {currentIdiom.expression}
            </h2>
            
            <div className="space-y-8">
              {/* 의미 */}
              <div className="p-6 bg-korean-100/50 rounded-lg">
                <p className="text-base text-gray-800">{currentIdiom.meaning}</p>
                <p className="text-base text-gray-600 mt-2">{currentIdiom.meaning_en}</p>
              </div>

              {/* 예문 */}
              <div>
                <h3 className="text-xl font-bold text-korean-700 mb-3">예문:</h3>
                <div className="p-6 border border-gray-200 rounded-lg space-y-4 whitespace-pre-wrap bg-gray-50">
                  <p className="text-gray-800">{currentIdiom.example_sentence}</p>
                  <p className="text-gray-600 text-sm">{currentIdiom.example_sentence_en}</p>
                </div>
              </div>

              {/* 상세 설명 */}
              {currentIdiom.explanation && (
                <div>
                  <h3 className="text-xl font-bold text-korean-700 mb-3">상세 설명:</h3>
                  <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-gray-700 whitespace-pre-line">{currentIdiom.explanation}</p>
                  </div>
                </div>
              )}

              {/* 상황 */}
              {currentIdiom.situation && (
                <div>
                   <h3 className="text-xl font-bold text-korean-700 mb-3">사용 상황:</h3>
                   <div className="p-4 bg-yellow-100/60 border border-yellow-200 rounded-lg">
                     <p className="text-gray-700">{currentIdiom.situation}</p>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* 네비게이션 */}
          <div className="flex justify-between items-center mt-8">
            <button onClick={handlePrev} className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg shadow-md hover:bg-gray-100 transition-all">
              <ChevronLeft className="w-5 h-5"/>
              이전
            </button>
            <div className="text-lg font-semibold text-gray-600">
              {currentIndex + 1} / {idioms.length}
            </div>
            <button onClick={handleNext} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all">
              다음
              <ChevronRight className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 