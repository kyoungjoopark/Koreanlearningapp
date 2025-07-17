'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import TTSButton from '@/components/TTSButton';

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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // 진행 상황 추적을 위한 상태
  const [progress, setProgress] = useState({
    currentIndex: 0,
    totalItems: idioms.length,
    completedItems: [] as number[],
    isLevelCompleted: false
  });
  const [loadingProgress, setLoadingProgress] = useState(true);

  // 진행 상황 불러오기
  useEffect(() => {
    const loadProgress = async () => {
      try {
        console.log('[Idioms] Loading progress for:', { level, idiomsLength: idioms.length });
        
        const url = `/api/expression-progress?contentType=idioms&level=${level}`;
        console.log('[Idioms] API URL:', url);
        
        const response = await fetch(url);
        console.log('[Idioms] API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Idioms] API Response data:', data);
          
          const newProgress = {
            currentIndex: data.currentIndex || 0,
            totalItems: idioms.length,
            completedItems: data.completedItems || [],
            isLevelCompleted: data.isLevelCompleted || false
          };
          
          console.log('[Idioms] Setting progress:', newProgress);
          setProgress(newProgress);
          setCurrentIndex(data.currentIndex || 0);
        } else {
          const errorText = await response.text();
          console.error('[Idioms] API Error response:', response.status, errorText);
        }
      } catch (error) {
        console.error('[Idioms] Failed to load progress:', error);
      } finally {
        setLoadingProgress(false);
      }
    };

    if (idioms.length > 0) {
      loadProgress();
    }
  }, [level, idioms.length]);

  useEffect(() => {
    setCurrentIdioms(idioms);
  }, [idioms]);

  // 진행 상황 업데이트 함수
  const updateProgress = async (newIndex: number, isCompleted: boolean = false) => {
    console.log('[Idioms] Updating progress:', { newIndex, isCompleted, currentProgress: progress });
    
    const newCompletedItems = isCompleted 
      ? [...new Set([...progress.completedItems, newIndex])]
      : progress.completedItems;
    
    const newProgress = {
      currentIndex: newIndex,
      totalItems: idioms.length,
      completedItems: newCompletedItems,
      isLevelCompleted: newCompletedItems.length === idioms.length
    };

    console.log('[Idioms] New progress to save:', newProgress);
    setProgress(newProgress);

    // 완료 상태 체크 및 알림 표시
    if (newProgress.isLevelCompleted && !progress.isLevelCompleted) {
      setTimeout(() => {
        setShowCompletionModal(true);
      }, 1000); // 1초 후 완료 모달 표시
    }

    try {
      const requestData = {
        contentType: 'idioms',
        level: level,
        ...newProgress
      };
      
      console.log('[Idioms] Sending POST request:', requestData);
      
      const response = await fetch('/api/expression-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      console.log('[Idioms] POST Response status:', response.status);
      console.log('[Idioms] POST Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        console.log('[Idioms] POST Success:', result);
        // 성공 시 UI에 표시
        setError('');
      } else {
        const errorText = await response.text();
        console.error('[Idioms] POST Error response:', response.status, errorText);
        setError(`진행률 저장 실패: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('[Idioms] Failed to update progress:', error);
      setError(`진행률 저장 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
    const newIndex = (currentIndex + 1) % currentIdioms.length;
    setCurrentIndex(newIndex);
    updateProgress(newIndex, true); // 현재 항목을 완료로 표시
  };

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + currentIdioms.length) % currentIdioms.length;
    setCurrentIndex(newIndex);
    updateProgress(newIndex);
  };

  // 처음으로 돌아가기 기능
  const handleResetProgress = async () => {
    try {
      const resetData = {
        contentType: 'idioms',
        level: level,
        currentIndex: 0,
        totalItems: idioms.length,
        completedItems: [],
        isLevelCompleted: false
      };
      
      console.log('[Idioms] Resetting progress:', resetData);
      
      const response = await fetch('/api/expression-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });
      
      if (response.ok) {
        setProgress(resetData);
        setCurrentIndex(0);
        setShowResetModal(false);
        setShowCompletionModal(false);
        console.log('[Idioms] Progress reset successfully');
      } else {
        const errorText = await response.text();
        console.error('[Idioms] Reset failed:', errorText);
        setError('진행률 리셋에 실패했습니다.');
      }
    } catch (error) {
      console.error('[Idioms] Reset error:', error);
      setError('진행률 리셋에 실패했습니다.');
    }
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
    return text.split('\n').filter(line => line.trim() !== '').map((line, index) => {
      const trimmedLine = line.trim();
      // 이미 화자 표시가 있는지 확인 (가:, 나:, A:, B: 등)
      const hasExistingSpeaker = /^[가-힣A-Z]:\s*/.test(trimmedLine);
      
      if (hasExistingSpeaker) {
        // 이미 화자 표시가 있으면 그대로 사용
        return <span key={index} className="block">{trimmedLine}</span>;
      } else {
        // 화자 표시가 없으면 추가
        const speaker = speakers[index % speakers.length] || speakers[0];
        return <span key={index} className="block">{`${speaker}: ${trimmedLine}`}</span>;
      }
    });
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

          {/* 진행률 표시 */}
          {!loadingProgress && (
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">학습 진행률</span>
                <span className="text-sm text-gray-600">
                  {progress.completedItems.length}/{progress.totalItems} 완료
                  {progress.isLevelCompleted && <span className="ml-2 text-green-600 font-bold">✓ 완료!</span>}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progress.totalItems > 0 ? (progress.completedItems.length / progress.totalItems) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>시작</span>
                <span>{Math.round((progress.completedItems.length / progress.totalItems) * 100)}%</span>
                <span>완료</span>
              </div>
            </div>
          )}

          {/* 네비게이션 - 제목 위로 이동 */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrev} className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg shadow-md hover:bg-gray-100 transition-all">
              <ChevronLeft className="w-5 h-5"/>
              이전
            </button>
            <div className="flex flex-col items-center">
              <div className="text-lg font-semibold text-gray-600">
                {currentIndex + 1} / {currentIdioms.length}
              </div>
              <button 
                onClick={() => setShowResetModal(true)}
                className="text-sm text-gray-500 hover:text-gray-700 underline mt-1"
              >
                처음으로 돌아가기
              </button>
            </div>
            <button onClick={handleNext} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all">
              다음
              <ChevronRight className="w-5 h-5"/>
            </button>
          </div>

          
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
            {/* 제목과 의미만 합치기 */}
            {(() => {
              const titleAndMeaning = [
                currentIdiom.expression,
                currentIdiom.meaning,
                currentIdiom.meaning_en
              ].filter(Boolean).join('. ');

              return (
                <div className="flex items-center justify-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-center text-korean-800 mr-4">
                    {currentIdiom.expression}
                  </h2>
                  <TTSButton text={titleAndMeaning} size="sm" />
                </div>
              );
            })()}
            
            <div className="space-y-8">
              {/* 의미 */}
              <div className="p-6 bg-korean-100/50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <p className="text-base text-gray-800">{currentIdiom.meaning}</p>
                    <p className="text-base text-gray-600 mt-2">{currentIdiom.meaning_en}</p>
                  </div>
                </div>
              </div>

              {/* 예문 */}
              {currentIdiom.example_sentence && (
                <div>
                  <div className="flex items-center mb-3">
                    <h3 className="text-xl font-bold text-korean-700 mr-3">예문:</h3>
                    <TTSButton text={`${currentIdiom.example_sentence || ''}. ${currentIdiom.example_sentence_en || ''}`} size="sm" />
                  </div>
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
                  <div className="flex items-center mb-3">
                    <h3 className="text-xl font-bold text-korean-700 mr-3">상세 설명:</h3>
                    <TTSButton text={currentIdiom.explanation || ''} size="sm" />
                  </div>
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

      {/* 완료 축하 모달 */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">축하합니다!</h2>
            <p className="text-gray-700 mb-6">
              '{level}' 레벨 관용구를 모두 완료했습니다!<br/>
              총 {idioms.length}개의 관용구를 학습했어요.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                계속 학습하기
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setShowResetModal(true);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                처음부터 다시하기
              </button>
              <Link
                href="/learn/idioms"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                다른 레벨 선택
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 처음으로 돌아가기 확인 모달 */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">진행률 초기화</h2>
            <p className="text-gray-600 mb-6">
              현재까지의 학습 진행률이 모두 초기화되고<br/>
              첫 번째 관용구부터 다시 시작됩니다.<br/>
              정말 초기화하시겠습니까?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleResetProgress}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                초기화하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 