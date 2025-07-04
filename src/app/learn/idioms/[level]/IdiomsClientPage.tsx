'use client';

import { useState, useEffect } from 'react';
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
  const [currentIdioms, setCurrentIdioms] = useState(idioms);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrentIdioms(idioms);
  }, [idioms]);

  // 레벨별 빈도 설명 매핑
  const getFrequencyDescription = (level: string) => {
    if (level.startsWith('속담')) return level;
    
    const frequencyMap: { [key: string]: string } = {
      '초급': '빈도 낮음',
      '중급': '빈도 보통', 
      '고급': '빈도 높음'
    };
    
    return frequencyMap[level] || level;
  };

  if (!idioms || idioms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>'{level}' 레벨에 해당하는 관용구를 찾을 수 없습니다.</p>
        <Link href={level.startsWith('속담') ? "/learn/expressions/proverbs" : "/learn/idioms"} className="mt-4 text-blue-600 hover:underline">
          레벨 선택으로 돌아가기
        </Link>
      </div>
    );
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % currentIdioms.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + currentIdioms.length) % currentIdioms.length);
  };

  const currentIdiom = currentIdioms[currentIndex];

  const handleGenerateExplanation = async () => {
    if (!currentIdiom) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-idiom-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentIdiom.id,
          expression: currentIdiom.expression,
          meaning: currentIdiom.meaning,
          level: currentIdiom.level
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '설명 생성에 실패했습니다.');
      }
      
      const updatedIdioms = currentIdioms.map(idiom =>
        idiom.id === currentIdiom.id ? { ...idiom, explanation: data.explanation } : idiom
      );
      setCurrentIdioms(updatedIdioms);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderDialogue = (text: string | null, isKorean: boolean) => {
    if (!text) return null;

    try {
      if (text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        return Object.entries(parsed).map(([speaker, line]) => (
          <span key={speaker} className="block">{`${speaker}: ${line}`}</span>
        ));
      }
    } catch (e) {
      // Not valid JSON, fall back to multiline text
    }

    const speakers = isKorean ? ['가', '나', '다'] : ['A', 'B', 'C'];
    return text.split('\n').filter(line => line.trim() !== '').map((line, index) => (
      <span key={index} className="block">{`${speakers[index]}: ${line}`}</span>
    ));
  };

  return (
    <div className="min-h-screen bg-korean-50 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <Link href={level.startsWith('속담') ? "/learn/expressions/proverbs" : "/learn/idioms"} className="flex items-center text-korean-700 hover:text-korean-800 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              레벨 선택으로 돌아가기
            </Link>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-lg text-korean-600">
              {getFrequencyDescription(level)}
            </p>
          </div>

          {/* 네비게이션 - 제목 위로 이동 */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrev} className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg shadow-md hover:bg-gray-100 transition-all">
              <ChevronLeft className="w-5 h-5"/>
              이전
            </button>
            <div className="text-lg font-semibold text-gray-600">
              {currentIndex + 1} / {currentIdioms.length}
            </div>
            <button onClick={handleNext} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all">
              다음
              <ChevronRight className="w-5 h-5"/>
            </button>
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
              {currentIdiom.example_sentence && (
                <div>
                  <h3 className="text-xl font-bold text-korean-700 mb-3">예문:</h3>
                  <div className="p-6 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {renderDialogue(currentIdiom.example_sentence, true)}
                    </div>
                    {currentIdiom.example_sentence_en && (
                       <div className="text-gray-600 text-sm whitespace-pre-wrap">
                        {renderDialogue(currentIdiom.example_sentence_en, false)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 상세 설명 */}
              {currentIdiom.explanation && (
                <div>
                  <h3 className="text-xl font-bold text-korean-700 mb-3">상세 설명:</h3>
                  <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-gray-700 whitespace-pre-line">{currentIdiom.explanation}</p>
                  </div>
                </div>
              )}

              {!currentIdiom.explanation && (
                <div>
                  <h3 className="text-xl font-bold text-korean-700 mb-3">상세 설명:</h3>
                  <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 text-center">
                    <p className="text-gray-500 mb-4">이 관용구에 대한 상세 설명이 아직 없습니다.</p>
                    <button
                      onClick={handleGenerateExplanation}
                      disabled={isGenerating}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
                    >
                      {isGenerating ? 'AI로 설명 생성 중...' : 'AI로 설명 생성하기'}
                    </button>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
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
        </div>
      </main>
    </div>
  );
} 