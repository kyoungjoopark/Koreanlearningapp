'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { parse } from 'path'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import IdiomsClientPage from './IdiomsClientPage' // 클라이언트 컴포넌트 임포트

// 데이터 타입
interface ExpressionItem {
  id: number;
  expression: string;
  meaning: string;
  example_sentence?: string;
}

// --- 관용구 데이터 파싱을 위한 헬퍼 함수 ---
const parseContent = (content: string) => {
  if (!content) return { korean: '', english: '', explanation: '' };

  const englishStartIndex = content.search(/[a-zA-Z]/);
  if (englishStartIndex === -1) {
    return { korean: content, english: '', explanation: '' };
  }

  const korean = content.substring(0, englishStartIndex).trim();
  const rest = content.substring(englishStartIndex);
  
  // 영어 문장이 끝나고(.?!) 공백 뒤에 한글이 오는 패턴으로 보충 설명의 시작을 감지.
  const explanationMatch = rest.match(/(?<=[.?!])\s+([ㄱ-ㅎㅏ-ㅣ가-힣])/);
  
  if (!explanationMatch || explanationMatch.index === undefined) {
    return { korean, english: rest.trim(), explanation: '' };
  }

  const english = rest.substring(0, explanationMatch.index).trim();
  const explanation = rest.substring(explanationMatch.index).trim();

  return { korean, english, explanation };
};

const parseExample = (example: string) => {
  if (!example) return [];

  const parts = example.split(/(?=\s[가-힣]:)/).map(p => p.trim()).filter(Boolean);
  const dialogues: { speaker: string; korean: string; english: string; explanation: string }[] = [];

  parts.forEach(part => {
    const speakerMatch = part.match(/^([가-힣]:)/);
    if (speakerMatch) {
      const speaker = speakerMatch[1];
      const content = part.substring(speaker.length).trim();
      const { korean, english, explanation } = parseContent(content);
      dialogues.push({ speaker, korean, english, explanation });
    } else {
      const { korean, english, explanation } = parseContent(part);
      if (korean || english || explanation) {
        dialogues.push({ speaker: '', korean, english, explanation });
      }
    }
  });

  return dialogues;
};

// --- Supabase 클라이언트 생성 ---
const createClt = (cookieStore: ReturnType<typeof cookies>) => {
    return createServerClient(
        process.env.NEXT_PUBLIC_DATA_SUPABASE_URL!,
        process.env.DATA_SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    );
}

// --- 레벨별 관용구 데이터 가져오기 ---
async function getIdiomsByLevel(level: string) {
    const cookieStore = cookies()
    const supabase = createClt(cookieStore)
    
    let query = supabase
        .from('idioms')
        .select('id, expression, meaning, meaning_en, example_sentence, example_sentence_en, explanation, situation')
        .eq('type', 'idiom');

    if (level !== 'all') {
        query = query.eq('level', level);
    }

    const { data, error } = await query.order('id', { ascending: true });

    if (error) {
        console.error('Error fetching idioms:', error);
        return [];
    }
    return data;
}

export default function ExpressionLearningPage() {
  const params = useParams()
  const type = params.type as string
  const level = params.level as string

  const [items, setItems] = useState<ExpressionItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);

  const decodedLevel = level ? decodeURIComponent(level) : '';
  const pageTitle = type === 'idioms' ? '관용구' : '속담'
  const levelTitle = decodedLevel.charAt(0).toUpperCase() + decodedLevel.slice(1)

  useEffect(() => {
    async function loadData() {
      if (!type || !level) return;
      
      setLoading(true)
      setError(null);

      try {
        const response = await fetch(`/api/expressions?type=${type}&level=${level}`, { cache: 'no-store' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '데이터를 불러오는 데 실패했습니다.');
        }
        const data = await response.json();
        setItems(data || []);
        setCurrentIndex(0);
      } catch (err: any) {
        console.error("Error loading expression data:", err);
        setError(err.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadData()
  }, [type, level])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const currentItem = items[currentIndex];

  return (
    <div className="flex flex-col min-h-screen bg-korean-50">
      <div className="w-full max-w-3xl mx-auto p-8 flex-grow flex flex-col">
        <div className="mb-8">
            <Link 
              href={`/learn/expressions/${type}`}
              className="flex items-center text-lg text-gray-700 hover:text-korean-600 font-semibold transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {type === 'idioms' ? '레벨 선택으로' : '자음 선택으로'} 돌아가기
            </Link>
        </div>
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-korean-800">{pageTitle} 학습 ({levelTitle})</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 flex-grow flex flex-col justify-between">
          {loading ? (
            <div className="text-center text-gray-600">데이터를 불러오는 중입니다...</div>
          ) : error ? (
            <div className="text-center text-red-600">오류: {error}</div>
          ) : !currentItem ? (
            <div className="text-center text-gray-600">학습할 항목이 없습니다.</div>
          ) : (
            <>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-center text-korean-700 mb-8">{currentItem.expression}</h2>
                
                {/* 관용구/속담에 따라 다른 UI 렌더링 */}
                {type === 'idioms' ? (
                  <>
                    {/* 관용구 의미 */}
                    <div className="bg-korean-100 p-6 rounded-lg mb-6">
                      <p className="text-lg text-gray-800">{parseContent(currentItem.meaning).korean}</p>
                      <p className="text-base text-gray-600 mt-2">{parseContent(currentItem.meaning).english}</p>
                    </div>

                    {/* 관용구 예문 */}
                    {currentItem.example_sentence && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">예문:</h3>
                        <div className="bg-gray-50 p-4 rounded-md space-y-4">
                          {parseExample(currentItem.example_sentence).map((dialogue, index) => (
                            <div key={index}>
                              <p className="text-lg text-gray-800">
                                {dialogue.speaker && <span className="font-bold">{dialogue.speaker}</span>} {dialogue.korean}
                              </p>
                              {dialogue.english && (
                                <p className="text-base text-gray-600 ml-5 mt-1">
                                  {dialogue.english}
                                </p>
                              )}
                              {/* 추가 설명 부분 렌더링 */}
                              {dialogue.explanation && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-base text-gray-700 leading-relaxed">{dialogue.explanation}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // 속담 의미
                  <div className="bg-gray-100 p-6 rounded-lg">
                    <h3 className="font-semibold text-lg text-gray-800 mb-3">의미</h3>
                    <p className="text-base text-gray-700 leading-relaxed">{currentItem.meaning}</p>
                  </div>
                )}
              </div>

              {/* 네비게이션 버튼 */}
              <div className="flex justify-between items-center mt-8">
                <button 
                  onClick={handlePrev} 
                  disabled={items.length < 2}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <span className="text-gray-600 font-medium">{currentIndex + 1} / {items.length}</span>
                <button 
                  onClick={handleNext} 
                  disabled={items.length < 2}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 