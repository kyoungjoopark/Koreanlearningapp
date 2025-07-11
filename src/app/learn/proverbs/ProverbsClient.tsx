'use client';

import { useState, useMemo, useEffect } from 'react';
import TTSButton from '@/components/TTSButton';
import { Proverb } from './page';

interface ProverbProgress {
  [initial: string]: {
    currentIndex: number;
    totalItems: number;
    completedItems: number[];
    isLevelCompleted: boolean;
  };
}

const INITIALS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 한글 초성 추출 함수
const getInitial = (text: string): string | null => {
  const firstChar = text.charCodeAt(0);
  if (firstChar >= 0xAC00 && firstChar <= 0xD7A3) { // 한글 음절 범위
    const index = Math.floor((firstChar - 0xAC00) / 588);
    return INITIALS[index];
  }
  return null; // 한글이 아닌 경우
};

export default function ProverbsClient({ proverbs }: { proverbs: Proverb[] }) {
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  
  // 진행 상황 추적을 위한 상태
  const [progress, setProgress] = useState<ProverbProgress>({});
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [viewedItems, setViewedItems] = useState<Set<number>>(new Set());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [completedInitial, setCompletedInitial] = useState<string | null>(null);

  // 진행 상황 불러오기
  useEffect(() => {
    const loadAllProgress = async () => {
      try {
        const progressData: ProverbProgress = {};
        
        // 모든 초성에 대한 진행 상황 로드
        for (const initial of INITIALS) {
          const response = await fetch(`/api/expression-progress?contentType=proverbs&level=${initial}`);
          if (response.ok) {
            const data = await response.json();
            const proverbsForInitial = proverbs.filter(p => getInitial(p.proverb) === initial);
            progressData[initial] = {
              currentIndex: data.currentIndex || 0,
              totalItems: proverbsForInitial.length,
              completedItems: data.completedItems || [],
              isLevelCompleted: data.isLevelCompleted || false
            };
          }
        }
        
        setProgress(progressData);
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setLoadingProgress(false);
      }
    };

    loadAllProgress();
  }, [proverbs]);

  // 진행 상황 업데이트 함수
  const updateProgress = async (initial: string, proverbId: number) => {
    const proverbsForInitial = proverbs.filter(p => getInitial(p.proverb) === initial);
    const currentProgress = progress[initial] || {
      currentIndex: 0,
      totalItems: proverbsForInitial.length,
      completedItems: [],
      isLevelCompleted: false
    };

    const newCompletedItems = [...new Set([...currentProgress.completedItems, proverbId])];
    const newProgress = {
      ...currentProgress,
      completedItems: newCompletedItems,
      isLevelCompleted: newCompletedItems.length === proverbsForInitial.length
    };

    console.log('[Proverbs] Updating progress:', { initial, proverbId, newProgress });

    setProgress(prev => ({
      ...prev,
      [initial]: newProgress
    }));

    // 완료 상태 체크 및 알림 표시
    if (newProgress.isLevelCompleted && !currentProgress.isLevelCompleted) {
      setCompletedInitial(initial);
      setTimeout(() => {
        setShowCompletionModal(true);
      }, 1000); // 1초 후 완료 모달 표시
    }

    try {
      const requestData = {
        contentType: 'proverbs',
        level: initial,
        ...newProgress
      };
      
      console.log('[Proverbs] Sending POST request:', requestData);
      
      const response = await fetch('/api/expression-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      console.log('[Proverbs] POST Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[Proverbs] POST Success:', result);
      } else {
        const errorText = await response.text();
        console.error('[Proverbs] POST Error response:', response.status, errorText);
      }
    } catch (error) {
      console.error('[Proverbs] Failed to update progress:', error);
    }
  };

  // 속담을 "완료"로 표시하는 함수
  const markAsCompleted = (proverb: Proverb) => {
    const initial = getInitial(proverb.proverb);
    if (initial) {
      updateProgress(initial, proverb.id);
      setViewedItems(prev => new Set([...prev, proverb.id]));
    }
  };

  // 특정 초성 진행률 리셋 기능
  const handleResetProgress = async (initial: string) => {
    try {
      const resetData = {
        contentType: 'proverbs',
        level: initial,
        currentIndex: 0,
        totalItems: proverbs.filter(p => getInitial(p.proverb) === initial).length,
        completedItems: [],
        isLevelCompleted: false
      };
      
      console.log('[Proverbs] Resetting progress for:', initial, resetData);
      
      const response = await fetch('/api/expression-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });
      
      if (response.ok) {
        setProgress(prev => ({
          ...prev,
          [initial]: resetData
        }));
        setShowResetModal(false);
        setShowCompletionModal(false);
        setCompletedInitial(null);
        console.log('[Proverbs] Progress reset successfully for:', initial);
      } else {
        const errorText = await response.text();
        console.error('[Proverbs] Reset failed:', errorText);
      }
    } catch (error) {
      console.error('[Proverbs] Reset error:', error);
    }
  };

  const filteredProverbs = useMemo(() => {
    if (!selectedInitial) {
      return proverbs;
    }
    return proverbs.filter(p => getInitial(p.proverb) === selectedInitial);
  }, [proverbs, selectedInitial]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-korean-800">속담 학습</h1>
        <p className="text-lg text-korean-600 mt-2">
          초성을 선택하여 관련 속담을 찾아보세요.
        </p>
      </div>
      
      <div className="flex justify-center flex-wrap gap-2 mb-10">
        <button
          onClick={() => setSelectedInitial(null)}
          className={`px-4 py-2 text-lg rounded-full transition-colors ${
            !selectedInitial ? 'bg-korean-600 text-white' : 'bg-white text-korean-700 border border-gray-300 hover:bg-gray-100'
          }`}
        >
          전체
        </button>
        {INITIALS.map(initial => {
          const initialProgress = progress[initial];
          const isCompleted = initialProgress?.isLevelCompleted;
          
          return (
            <div key={initial} className="relative">
              <button
                onClick={() => setSelectedInitial(initial)}
                className={`w-12 h-12 text-lg rounded-full transition-colors relative ${
                  selectedInitial === initial ? 'bg-korean-600 text-white' : 'bg-white text-korean-700 border border-gray-300 hover:bg-gray-100'
                } ${isCompleted ? 'ring-2 ring-green-400' : ''}`}
              >
                {initial}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
              {isCompleted && (
                <button
                  onClick={() => {
                    setCompletedInitial(initial);
                    setShowResetModal(true);
                  }}
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 hover:text-gray-700 bg-white rounded px-1 shadow-sm border"
                  title="초기화"
                >
                  리셋
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택된 초성의 진행률 표시 */}
      {selectedInitial && !loadingProgress && progress[selectedInitial] && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">'{selectedInitial}' 학습 진행률</span>
            <span className="text-sm text-gray-600">
              {progress[selectedInitial].completedItems.length}/{progress[selectedInitial].totalItems} 완료
              {progress[selectedInitial].isLevelCompleted && <span className="ml-2 text-green-600 font-bold">✓ 완료!</span>}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${progress[selectedInitial].totalItems > 0 ? (progress[selectedInitial].completedItems.length / progress[selectedInitial].totalItems) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>시작</span>
            <span>{Math.round((progress[selectedInitial].completedItems.length / progress[selectedInitial].totalItems) * 100)}%</span>
            <span>완료</span>
          </div>
        </div>
      )}

      <div className="space-y-4 max-w-4xl mx-auto">
        {filteredProverbs.length > 0 ? (
          filteredProverbs.map(proverb => {
            // 제목과 의미만 합치기
            const titleAndMeaning = [
              proverb.proverb,
              proverb.meaning,
              proverb.meaning_en
            ].filter(Boolean).join('. ');

            const initial = getInitial(proverb.proverb);
            const isCompleted = !!(initial && progress[initial]?.completedItems.includes(proverb.id));

            return (
              <div key={proverb.id} className={`bg-white p-6 rounded-lg border shadow-sm transition-all ${
                isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-korean-800">{proverb.proverb}</h3>
                  <div className="flex items-center gap-2">
                    <TTSButton text={titleAndMeaning} size="sm" />
                    <button
                      onClick={() => markAsCompleted(proverb)}
                      disabled={isCompleted}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        isCompleted 
                          ? 'bg-green-500 text-white cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {isCompleted ? '✓ 완료' : '완료'}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-grow">
                    <p className="text-korean-600 mb-2">{proverb.meaning}</p>
                    <p className="text-gray-500 text-sm italic">{proverb.meaning_en}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center mb-2">
                    <h4 className="font-semibold text-korean-700 mr-2">예문:</h4>
                    <TTSButton text={`${proverb.example_sentence}. ${proverb.example_sentence_en}`} size="sm" />
                  </div>
                  <p className="text-korean-600">{proverb.example_sentence}</p>
                  <p className="text-gray-500 text-sm italic">{proverb.example_sentence_en}</p>
                </div>

                {proverb.explanation_en && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center mb-2">
                      <h4 className="font-semibold text-korean-700 mr-2">상세 설명:</h4>
                      <TTSButton text={proverb.explanation_en} size="sm" />
                    </div>
                    <p className="text-gray-700 whitespace-pre-line">{proverb.explanation_en}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-korean-500">
              {selectedInitial ? `'${selectedInitial}'(으)로 시작하는 속담이 없습니다.` : '등록된 속담이 없습니다.'}
            </p>
          </div>
        )}
      </div>

      {/* 완료 축하 모달 */}
      {showCompletionModal && completedInitial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">축하합니다!</h2>
            <p className="text-gray-700 mb-6">
              '{completedInitial}' 초성 속담을 모두 완료했습니다!<br/>
              총 {proverbs.filter(p => getInitial(p.proverb) === completedInitial).length}개의 속담을 학습했어요.
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
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setSelectedInitial(null);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                다른 초성 선택
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 진행률 초기화 확인 모달 */}
      {showResetModal && completedInitial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">진행률 초기화</h2>
            <p className="text-gray-600 mb-6">
              '{completedInitial}' 초성 속담의 학습 진행률이 모두 초기화되고<br/>
              처음부터 다시 시작됩니다.<br/>
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
                onClick={() => handleResetProgress(completedInitial)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                초기화하기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 