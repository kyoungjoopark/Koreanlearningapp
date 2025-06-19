'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookText, Lightbulb, Mic, Headphones, Edit, Eye, Volume2, ChevronLeft, ChevronRight } from 'lucide-react'

// 대표 과목명 목록 (courses/page.tsx의 MAIN_COURSES와 일치 또는 공유 필요)
const REPRESENTATIVE_COURSES = [
  "세종학당 한국어",
  "세종학당 실용 한국어",
  "세종한국어"
];

// 전체 과목명에서 대표 과목명을 추출하는 헬퍼 함수
const getRepresentativeCourseName = (fullCourseName: string): string | null => {
  if (!fullCourseName) return null;
  for (const repCourse of REPRESENTATIVE_COURSES) {
    if (fullCourseName.startsWith(repCourse)) {
      return repCourse;
    }
  }
  return null; // 혹은 fullCourseName 자체를 반환하거나, 기본값을 설정할 수 있음
};

interface UnitDetails {
  id: string;
  과목: string;
  단계: string;
  단원명: string;
  주제: string;
  제목: string;
  어휘: string;
  문법: string;
  부가문법?: string;
  듣기?: string;
  말하기?: string;
  읽기?: string;
  쓰기?: string;
  related_keywords?: string[];
  // 추가적으로 필요한 필드가 있다면 여기에 정의
}

export default function UnitPage() {
  const params = useParams()
  const router = useRouter()
  const unitId = params.unitId as string

  const [unit, setUnit] = useState<UnitDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // AI 예문 생성 관련 상태
  const [aiActivityLoading, setAiActivityLoading] = useState<Record<string, boolean>>({});
  const [aiActivityError, setAiActivityError] = useState<Record<string, string | null>>({});
  const [generatedExamples, setGeneratedExamples] = useState<Record<string, any[]>>({});
  const [learnedWordsLog, setLearnedWordsLog] = useState<string[]>([]);

  // AI 문법 설명 관련 상태 추가
  const [grammarExplanations, setGrammarExplanations] = useState<Record<string, string>>({});
  const [grammarExplanationLoading, setGrammarExplanationLoading] = useState<Record<string, boolean>>({});
  const [grammarExplanationError, setGrammarExplanationError] = useState<Record<string, string | null>>({});

  // unit.제목 (주요 표현)에 대한 AI 생성 설명 상태
  const [aiUnitTitleExplanation, setAiUnitTitleExplanation] = useState<string | null>(null);
  const [aiUnitTitleExplanationLoading, setAiUnitTitleExplanationLoading] = useState<boolean>(false);
  const [aiUnitTitleExplanationError, setAiUnitTitleExplanationError] = useState<string | null>(null);

  const [combinedGrammar, setCombinedGrammar] = useState<string[]>([]);
  const [backLink, setBackLink] = useState<string>('/courses'); // 기본 링크

  // 이전/다음 단원 네비게이션 상태 추가
  const [navigationInfo, setNavigationInfo] = useState<{
    prevUnit: { id: number; title: string } | null;
    nextUnit: { id: number; title: string } | null;
  } | null>(null);

  // 학습 완료 상태 추가
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 학습 완료 처리 함수
  const handleComplete = async () => {
    if (!unitId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: parseInt(unitId) })
      });
      if (response.ok) {
        setIsCompleted(true);
      } else {
        const errorData = await response.json();
        console.error("Failed to mark as complete:", errorData.error);
        alert('학습 완료 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error("Error submitting completion:", error);
      alert('학습 완료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로깅을 위한 setBackLink 래퍼 함수
  const updateBackLink = (newLink: string, reason: string) => {
    console.log(`[ULP_BACKLINK_TRACE] updateBackLink: Reason="${reason}", NewLink="${newLink}", UnitId="${unitId}"`);
    setBackLink(newLink);
  };

  // 특정 문법 항목에 대한 미리 정의된 기본 설명
  const predefinedGrammarDetails: Record<string, { example: string; basicExplanation: string }> = {
    "N은/는": {
      example: "저는 한국 사람이에요.",
      basicExplanation: "'은/는'은 문장의 주제를 나타내거나 다른 것과 대조할 때 사용해요. 명사 뒤에 붙으며, 명사의 마지막 글자에 받침이 없으면 '는' (예: 저 + 는 -> 저는), 받침이 있으면 '은' (예: 사람 + 은 -> 사람은)을 사용합니다."
    },
    "은": { // "은"에 대한 설명 추가
      example: "저는 한국 사람이에요.", // "은"이 사용된 예문 (실제로는 "는"이지만 대표 예시로 사용)
      basicExplanation: "'은/는'은 문장의 주제를 나타내거나 다른 것과 대조할 때 사용해요. 명사 뒤에 붙으며, '은'은 주로 받침이 있는 명사 뒤에 사용됩니다. (예: 사람 + 은 -> 사람은)"
    },
    "는": { // "는"에 대한 설명 추가
      example: "저는 한국 사람이에요.",
      basicExplanation: "'은/는'은 문장의 주제를 나타내거나 다른 것과 대조할 때 사용해요. 명사 뒤에 붙으며, '는'은 주로 받침이 없는 명사 뒤에 사용됩니다. (예: 저 + 는 -> 저는)"
    },
    "이다": { // 스크린샷에 "이다"도 보이므로 기본 설명 추가
        example: "이것은 책이에요.",
        basicExplanation: "'이다'는 '~입니다', '~이에요/예요' 형태로, 주어가 무엇인지 또는 어떤 상태인지를 설명하는 서술격 조사입니다. 명사 뒤에 붙어 문장을 마무리합니다. (예: 학생 + 이다 -> 학생이다, 학생이에요)"
    },
    "이/가": { // 추가
      example: "사과가 맛있어요. 이것이 책이에요.",
      basicExplanation: "'이/가'는 문장의 주어를 나타내는 주격 조사입니다. 주어가 되는 명사 뒤에 붙습니다. 명사의 마지막 글자에 받침이 없으면 '가' (예: 사과 + 가 -> 사과가), 받침이 있으면 '이' (예: 책 + 이 -> 책이)를 사용합니다."
    },
    "이/가 아니다": { // 추가
      example: "저는 학생이 아니에요. 이것은 연필이 아니에요.",
      basicExplanation: "'이/가 아니다'는 주어가 특정 명사가 아님을 나타내는 표현입니다. '명사 + 이/가 아니다' 형태로 사용됩니다. '아니다'는 '이다'의 부정형입니다."
    }
    // 필요하다면 다른 문법 항목에 대한 기본 설명도 추가 가능
  };

  // 단원의 제목(핵심 문장)에 대한 설명
  const unitKeySentenceExplanation: Record<string, { title: string; explanation: string; }> = {
    // "저는 한국 사람이에요.": { // unit.제목이 이 문자열과 일치할 경우
    //   title: "저는 한국 사람이에요.",
    //   explanation: "이 문장은 자신을 소개할 때 사용하는 기본적인 표현입니다. '저'는 자신을 낮추어 부르는 말이고, '는'은 문장의 주제를 나타냅니다. '한국 사람'은 국적을, '이에요'는 명사 뒤에 붙어 '입니다'와 같이 서술하는 역할을 합니다. 이 문장에서는 주로 'N은/는' 토픽 조사와 'N이다' 서술격 조사의 활용을 배웁니다."
    // }
    // 다른 unit.제목에 대한 설명을 추가할 수 있습니다.
  };

  // TTS 함수 복원
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // 진행 중인 음성 취소
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('죄송합니다. 사용하시는 브라우저가 음성 합성을 지원하지 않습니다.');
      console.log('[ULP_DEBUG] Speech synthesis not supported');
    }
  };

  const renderExplanation = (
    predefined: string | undefined,
    ai: string | null,
    loading: boolean,
    error: string | null,
  ) => {
    if (loading) {
      return <p className="text-gray-700 whitespace-pre-wrap">AI 설명을 불러오는 중...</p>;
    }
    if (error) {
      return <p className="text-red-500">AI 설명 로딩 중 오류: {error}</p>;
    }
    const explanation = predefined || ai;

    if (!explanation) {
      return <p className="text-gray-500 italic">설명이 없습니다.</p>;
    }

    return (
      <p className="text-gray-700 whitespace-pre-wrap flex-grow">{explanation}</p>
    );
  };

  useEffect(() => {
    const storedLearnedWords = localStorage.getItem('learnedWordsLog');
    if (storedLearnedWords) {
      setLearnedWordsLog(JSON.parse(storedLearnedWords));
    }

    // fetchUnitDetails와 fetchNavigationInfo 함수를 useEffect 내부에 정의
    async function fetchNavigationInfo(currentUnitId: string) {
      try {
        const response = await fetch(`/api/koreantraining/navigation/${currentUnitId}`);
        if (!response.ok) {
          throw new Error('네비게이션 정보 로딩 실패');
        }
        const data = await response.json();
        setNavigationInfo(data);
      } catch (err) {
        console.error('[ULP_ERROR] Error fetching navigation info:', err);
        setNavigationInfo(null); // 에러 발생 시 초기화
      }
    }

    async function fetchUnitDetails() {
      console.log(`[ULP_DEBUG] fetchUnitDetails for unitId: ${unitId} - START`);
      setLoading(true);
      setError(null);
      setUnit(null);
      // backLink의 기본값을 /courses로 설정하고, unitId가 없을 경우에도 이 값을 유지하도록 함.
      // unit 정보 로드 성공 시에만 아래에서 쿼리 파라미터 포함 링크로 업데이트.
      updateBackLink('/courses', 'fetchUnitDetails_start'); 
      setCombinedGrammar([]);
      setAiUnitTitleExplanation(null);
      setAiUnitTitleExplanationLoading(false);
      setAiUnitTitleExplanationError(null);
      setNavigationInfo(null); // 단원 정보 다시 가져올 때 네비게이션 정보 초기화

      // 학습 완료 상태도 초기화
      setIsCompleted(false);
      
      try {
        const response = await fetch(`/api/koreantraining/unit/${unitId}`, {
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        console.log(`[ULP_DEBUG] Unit API response status for ${unitId}: ${response.status}`);
        const data: UnitDetails | null = await response.json();
        console.log(`[ULP_DEBUG] Unit data fetched for ${unitId}:`, data);

        if (!response.ok) {
          if (response.status === 404) {
            setError(`단원 정보(ID: ${unitId})를 찾을 수 없습니다.`);
          } else {
            setError(`단원 정보를 불러오는데 실패했습니다. (상태: ${response.status})`);
          }
          // updateBackLink('/courses', 'fetch error'); // 이미 시작 시 /courses로 설정됨
        } else if (data) { // response.ok 이고 data가 존재할 때만 처리
          setUnit(data);

          const repCourse = getRepresentativeCourseName(data.과목);
          
          if (repCourse) {
            // "단계 목록" (예: 초급1, 초급2 리스트)으로 돌아가도록 링크를 수정합니다.
            const newCalculatedLink = `/courses?course=${encodeURIComponent(repCourse)}`;
            updateBackLink(newCalculatedLink, 'fetchUnitDetails_success_repCourse_valid_to_stage_list');
          } else {
            console.warn(`[ULP_WARN] Cannot create specific backLink for stage list. Original 과목: ${data.과목}, RepCourse: ${repCourse}. Defaulting to /courses.`);
            updateBackLink('/courses', 'fetchUnitDetails_success_repCourse_invalid');
          }

          const grammarSet = new Set<string>();
          const splitAndTrim = (str: string) => str.split(';').map(s => s.trim()).filter(s => s.length > 0);
          if (data.문법 && typeof data.문법 === 'string') {
            splitAndTrim(data.문법).forEach(g => grammarSet.add(g));
          }
          if (data.부가문법 && typeof data.부가문법 === 'string') {
            splitAndTrim(data.부가문법).forEach(g => grammarSet.add(g));
          }
          const newCombinedGrammar = Array.from(grammarSet);
          setCombinedGrammar(newCombinedGrammar);

          // AI 제목 설명 로직 (data.제목이 있을 때만 실행)
          if (data.제목 && !unitKeySentenceExplanation[data.제목]) {
            if (!aiUnitTitleExplanation) {
              setAiUnitTitleExplanationLoading(true);
              setAiUnitTitleExplanationError(null);
              console.log(`[ULP_DEBUG] AI Title Explanation for "${data.제목}" - START Loading`);
              try {
                const dbQueryTitle = encodeURIComponent(data.제목);
                console.log(`[ULP_DEBUG] AI Title: Checking DB for "${dbQueryTitle}"`);
                const dbResponse = await fetch(`/api/grammar-explanations/${dbQueryTitle}?lang=ko`);
                console.log(`[ULP_DEBUG] AI Title: DB response status: ${dbResponse.status}`);
                
                if (dbResponse.ok) {
                  const dbData = await dbResponse.json();
                  if (dbData && dbData.explanation) {
                    console.log(`[ULP_DEBUG] AI Title: Using explanation for "${data.제목}" from DB`);
                    // [FIX] DB에서 받은 JSON 객체를 렌더링 가능한 문자열로 변환
                    setAiUnitTitleExplanation(formatStructuredExplanation(dbData.explanation));
                  } else {
                    console.log(`[ULP_DEBUG] AI Title: Fetching from AI for "${data.제목}" (DB data missing explanation or null data)`);
                    const aiResponse = await fetch('/api/generate-sentence-explanation', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sentence: data.제목,
                        unitLevel: data.단계,
                        unitTopic: data.주제,
                        unitVocabulary: data.어휘,
                        speakingTask: data.말하기,
                        unitGrammar: data.문법,
                        unitAdditionalGrammar: data.부가문법,
                        listeningTask: data.듣기,
                        readingTask: data.읽기,
                        writingTask: data.쓰기,
                        unitId: parseInt(unitId)
                      }),
                    });
                    console.log(`[ULP_DEBUG] AI Title: AI generation API response status: ${aiResponse.status}`);
                    const result = await aiResponse.json();
                    if (!aiResponse.ok) {
                      throw new Error(result.error || result.details || 'AI 문장 분석 설명 생성 실패');
                    }
                    setAiUnitTitleExplanation(formatStructuredExplanation(result));
                    console.log(`[ULP_DEBUG] AI Title: Fetched and set explanation from AI for "${data.제목}"`);
                  }
                } else if (dbResponse.status === 404) {
                  console.log(`[ULP_DEBUG] AI Title: Fetching from AI for "${data.제목}" (DB returned 404)`);
                  const aiResponse = await fetch('/api/generate-sentence-explanation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sentence: data.제목,
                      unitLevel: data.단계,
                      unitTopic: data.주제,
                      unitVocabulary: data.어휘,
                      speakingTask: data.말하기,
                      unitGrammar: data.문법,
                      unitAdditionalGrammar: data.부가문법,
                      listeningTask: data.듣기,
                      readingTask: data.읽기,
                      writingTask: data.쓰기,
                      unitId: parseInt(unitId)
                    }),
                  });
                  console.log(`[ULP_DEBUG] AI Title: AI generation API response status: ${aiResponse.status}`);
                  const result = await aiResponse.json();
                  if (!aiResponse.ok) {
                    throw new Error(result.error || result.details || 'AI 문장 분석 설명 생성 실패');
                  }
                  setAiUnitTitleExplanation(formatStructuredExplanation(result));
                  console.log(`[ULP_DEBUG] AI Title: Fetched and set explanation from AI for "${data.제목}"`);
                } else {
                  const errorDetails = await dbResponse.json().catch(() => ({ error: '서버 응답 처리 실패' }));
                  throw new Error(`AI 제목 설명 DB 조회 실패: ${dbResponse.status} - ${errorDetails.error || '알 수 없는 서버 오류'}`);
                }
              } catch (err: any) {
                console.error('[ULP_ERROR] Error fetching AI sentence explanation:', err);
                setAiUnitTitleExplanationError(err.message || 'AI 문장 분석 설명 로딩 중 오류 발생');
              } finally {
                setAiUnitTitleExplanationLoading(false);
                console.log(`[ULP_DEBUG] AI Title Explanation for "${data.제목}" - END Loading`);
              }
            } else {
              console.log(`[ULP_DEBUG] AI Title Explanation for "${data.제목}" already exists in state.`);
            }
          }
        } else if (!data && response.ok) { // response.ok 이지만 data가 null인 경우
          setError(`단원 데이터(ID: ${unitId})가 비어있습니다.`);
          // updateBackLink('/courses', 'response ok but no data'); // 이미 /courses로 설정됨
        }
      } catch (err: any) {
        console.error('[ULP_ERROR] Error in fetchUnitDetails catch block:', err);
        if (!error) {
          setError(err.message || '단원 정보를 불러오는 중 알 수 없는 오류가 발생했습니다.');
        }
        // updateBackLink('/courses', 'outer catch error'); // 이미 /courses로 설정됨
      } finally {
        setLoading(false);
        console.log(`[ULP_DEBUG] fetchUnitDetails for unitId: ${unitId} - END (loading: false)`);
      }
    }

    if (unitId) {
      fetchUnitDetails();
      fetchNavigationInfo(unitId); // 단원 정보와 함께 네비게이션 정보도 요청
    } else {
      console.log('[ULP_DEBUG] No unitId present on mount/update.');
      setLoading(false);
      setError('유효한 단원 ID가 없습니다.');
      setUnit(null);
      setCombinedGrammar([]);
      updateBackLink('/courses', 'useEffect_no_unitId');
      setNavigationInfo(null); // unitId가 없을 때도 초기화
      console.log('[ULP_DEBUG] useEffect - No unitId, backLink set to /courses.');
    }
  }, [unitId]); // 의존성 배열은 unitId만 포함

  // [NEW] Automatically fetch existing grammar explanations on load
  useEffect(() => {
    if (combinedGrammar.length > 0) {
      const fetchInitialExplanations = async () => {
        const initialExplanations: Record<string, string> = {};
        for (const grammarItem of combinedGrammar) {
          try {
            const dbQueryGrammarItem = encodeURIComponent(grammarItem);
            // This fetch only gets existing data, it does not generate new explanations.
            const response = await fetch(`/api/grammar-explanations/${dbQueryGrammarItem}?lang=ko`);
            
            if (response.ok) {
              const dbData = await response.json();
              if (dbData && dbData.explanation) {
                // [FIX] DB에서 받은 JSON 객체를 렌더링 가능한 문자열로 변환
                initialExplanations[grammarItem] = formatStructuredExplanation(dbData.explanation);
              }
            }
          } catch (error) {
            console.error(`[ULP_ERROR] Failed to fetch initial explanation for ${grammarItem}:`, error);
          }
        }
        if (Object.keys(initialExplanations).length > 0) {
          setGrammarExplanations(prev => ({ ...prev, ...initialExplanations }));
        }
      };
      fetchInitialExplanations();
    }
  }, [combinedGrammar]);

  // 사용자의 기존 학습 완료 기록을 확인하는 useEffect
  useEffect(() => {
    const checkCompletionStatus = async () => {
      if (!unitId) return;
      try {
        const response = await fetch('/api/progress');
        if (response.ok) {
          const completedLessons: { id: number }[] = await response.json();
          const isDone = completedLessons.some(lesson => lesson.id === parseInt(unitId));
          setIsCompleted(isDone);
        }
      } catch (error) {
        console.error("Error fetching completion status:", error);
      }
    };

    checkCompletionStatus();
  }, [unitId]);

  console.log(`[ULP_BACKLINK_TRACE] Rendering UnitPage for unitId: ${unitId}. Current backLink state: ${backLink}`);

  const addWordToLog = (word: string) => {
    setLearnedWordsLog(prevLog => {
      const newLog = Array.from(new Set([...prevLog, word])); 
      localStorage.setItem('learnedWordsLog', JSON.stringify(newLog));
      return newLog;
    });
  };

  // AI 문법 설명 생성 함수
  const fetchGrammarExplanation = async (grammarItem: string, currentUnitId: number, grammarType: 'grammar' | 'additional_grammar') => {
    console.log(`[ULP_DEBUG] fetchGrammarExplanation for "${grammarItem}" - START`);
    setGrammarExplanationLoading(prev => ({ ...prev, [grammarItem]: true }));
    setGrammarExplanations(prev => ({ ...prev, [grammarItem]: '' })); // 이전 설명 초기화
    setGrammarExplanationError(prev => ({ ...prev, [grammarItem]: null }));

    try {
      // 1. DB에서 먼저 확인
      const dbQueryGrammarItem = encodeURIComponent(grammarItem);
      const dbResponse = await fetch(`/api/grammar-explanations/${dbQueryGrammarItem}`);
      
      let explanationFromDb: string | null = null;
      let useDbExplanation = false;

      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        if (dbData && dbData.explanation) { // isApproved 체크는 추후에 (예: dbData.isApproved)
            // DB에서 가져온 explanation은 AI가 생성한 순수 설명 부분이므로, 포맷팅 필요
            console.log(`[ULP_DEBUG] DB data for ${grammarItem} (before formatting):`, dbData.explanation);
            explanationFromDb = formatStructuredExplanation(dbData.explanation);
            // 예: if (dbData.isApproved) { useDbExplanation = true; }
            if(explanationFromDb) { // 포맷팅 결과가 유효할 때만 사용
                useDbExplanation = true;
            }
        }
      }

      if (useDbExplanation && explanationFromDb) {
        console.log(`[ULP_DEBUG] Using explanation from DB for ${grammarItem}`);
        setGrammarExplanations(prev => ({ ...prev, [grammarItem]: explanationFromDb! }));
      } else {
        console.log(`[ULP_DEBUG] Fetching explanation from AI for ${grammarItem} (DB miss or not approved)`);
        // 2. DB에 없으면 AI로 생성 요청
        const aiResponse = await fetch('/api/generate-grammar-explanation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grammarItem,
            unitId: currentUnitId,
            grammarType,
            unitLevel: unit?.단계 // unit.단계(레벨) 정보 추가
          })
        });

        if (!aiResponse.ok) {
          const errorData = await aiResponse.json();
          throw new Error(errorData.error || 'AI 설명 생성 API 호출 실패');
        }

        const aiData = await aiResponse.json();
        
        console.log(`[ULP_DEBUG] AI data for ${grammarItem} (before formatting):`, aiData);
        const formattedExplanation = formatStructuredExplanation(aiData);
        setGrammarExplanations(prev => ({ ...prev, [grammarItem]: formattedExplanation }));
      }
    } catch (err: any) {
      console.error(`[ULP_ERROR] Error generating explanation for ${grammarItem}:`, err);
      setGrammarExplanationError(prev => ({ ...prev, [grammarItem]: err.message || '설명 생성 중 오류 발생' }));
    } finally {
      setGrammarExplanationLoading(prev => ({ ...prev, [grammarItem]: false }));
    }
  };

  // *** 새로 추가된 함수 ***
  // AI가 생성한 구조화된 JSON 설명을 사람이 읽기 좋은 문자열로 변환합니다.
  const formatStructuredExplanation = (data: any): string => {
    // data 자체가 explanation 객체일 수도 있고, data.explanation에 있을 수도 있으므로 둘 다 확인합니다.
    const explanation = data.explanation || data;
    
    if (!explanation || !explanation.usage_scenarios) {
      return "AI가 생성한 설명의 형식이 올바르지 않습니다. 다시 시도해주세요.";
    }

    let formatted = `${explanation.introduction}\n\n`;

    explanation.usage_scenarios.forEach((scenario: any, index: number) => {
        formatted += `**[용법 ${index + 1}] ${scenario.title}**\n`;
        formatted += `${scenario.explanation}\n`;
        formatted += `*예문: ${scenario.example.korean}*  (${scenario.example.english})\n\n`;
    });

    if (explanation.conjugation_rules && explanation.conjugation_rules !== '없음') {
        formatted += `**[결합 규칙]**\n${explanation.conjugation_rules}\n\n`;
    }

    if (explanation.common_mistakes && explanation.common_mistakes !== '없음') {
        formatted += `**[자주 하는 실수]**\n${explanation.common_mistakes}\n`;
    }

    return formatted.trim();
  }

  // 백업 파일의 handleGenerateExamples 함수 로직 (어휘 예문 생성)
  const handleGenerateExamples = async (word: string) => {
    if (!unit) return; 

    setAiActivityLoading(prev => ({ ...prev, [word]: true }));
    setAiActivityError(prev => ({ ...prev, [word]: null }));

    if (!learnedWordsLog.includes(word)) {
      addWordToLog(word);
    }

    try {
      const response = await fetch('/api/generate-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordData: { word }, 
          activityType: 'sentence_creation', // 백업 파일에서는 sentence_creation으로 고정되어 있었음
          grammarContext: unit.문법,
          unitTitle: unit.제목,
          unitVocabulary: unit.어휘, 
          unitRelatedKeywords: unit.related_keywords, 
          unitLevel: unit.단계 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'AI 예문 생성에 실패했습니다.');
      }
      
      let examplesToShow: any[] = [];
      if (data.generated_examples) {
        examplesToShow = data.generated_examples;
      } else {
        Object.keys(data).forEach(key => {
          if (key.startsWith('generated_examples_meaning_')) {
            examplesToShow.push(...data[key]);
          }
        });
      }
      const updatedExamples = { ...generatedExamples, [word]: examplesToShow };
      setGeneratedExamples(updatedExamples);
    } catch (err: any) {
      setAiActivityError(prev => ({ ...prev, [word]: err.message || '예문 생성 중 오류 발생' }));
    } finally {
      setAiActivityLoading(prev => ({ ...prev, [word]: false }));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">단원 정보를 불러오는 중...</div></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500">
        <p className="text-2xl mb-4">오류가 발생했습니다.</p>
        <p className="text-lg mb-6">{error}</p>
        <Link href="/courses" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          과목 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!unit) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">단원 정보를 찾을 수 없습니다.</div></div>;
  }

  // unit.과목에서 마지막 숫자와 공백 제거 (예: "세종학당 한국어1" -> "세종학당 한국어")
  const courseName = unit.과목.replace(/\s*\d+$/, '');

  const currentKeySentenceExplanation = unitKeySentenceExplanation[unit.제목] || { title: unit.제목, explanation: aiUnitTitleExplanation || "AI 설명을 생성 중이거나, 미리 정의된 설명이 없습니다." };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href={backLink} className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                <ArrowLeft size={20} className="mr-2" />
                단계로 돌아가기
              </Link>
            </div>
            <div className="text-lg font-semibold text-gray-700 truncate" title={`${unit.과목} - ${unit.단계} / ${unit.주제}`}>
                {`${unit.단원명 || unit.주제}`}
            </div>
            {/* 이전/다음 단원 네비게이션 버튼 영역 */}
            <div className="flex items-center space-x-2">
              {navigationInfo?.prevUnit ? (
                <Link
                  href={`/learn/${navigationInfo.prevUnit.id}`}
                  className="flex items-center text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-md transition-colors"
                  title={`이전: ${navigationInfo.prevUnit.title}`}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  <span>이전</span>
                </Link>
              ) : (
                <div className="flex items-center text-gray-400 px-3 py-1.5 rounded-md cursor-not-allowed">
                  <ChevronLeft size={16} className="mr-1" />
                  <span>이전</span>
                </div>
              )}
              {navigationInfo?.nextUnit ? (
                <Link
                  href={`/learn/${navigationInfo.nextUnit.id}`}
                  className="flex items-center text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-md transition-colors"
                  title={`다음: ${navigationInfo.nextUnit.title}`}
                >
                  <span>다음</span>
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              ) : (
                <div className="flex items-center text-gray-400 px-3 py-1.5 rounded-md cursor-not-allowed">
                  <span>다음</span>
                  <ChevronRight size={16} className="ml-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* 단원 정보 헤더 (현재 UI 유지) */}
        <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-3xl font-bold mb-2">{courseName} - {unit.단계}</h1>
          <p className="text-xl mb-1">주제: {unit.주제}</p>
          <p className="text-lg">주요 표현: {unit.제목}</p>
        </div>

        {/* --- 단원 해설 (구: 문법) 섹션 --- */}
        <div id="grammar" className="card mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <BookText className="mr-3 text-green-500" />
            단원 해설
          </h2>

          {/* 주요 표현 설명 */}
          {unit.제목 && (
            <div className="mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-yellow-800 mb-2">
                    주요 표현: {unit.제목}
                  </h3>
                  <button 
                    onClick={() => {
                      const predefined = unitKeySentenceExplanation[unit.제목]?.explanation;
                      const ai = aiUnitTitleExplanation;
                      const explanation = predefined || ai;
                      const textToSpeak = `${unit.제목}. ${explanation || ''}`;
                      speakText(textToSpeak);
                    }} 
                    className="text-yellow-600 hover:text-yellow-800 transition-colors"
                    disabled={aiUnitTitleExplanationLoading}
                    title="주요 표현과 설명 듣기"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
                {renderExplanation(
                  unitKeySentenceExplanation[unit.제목]?.explanation,
                  aiUnitTitleExplanation,
                  aiUnitTitleExplanationLoading,
                  aiUnitTitleExplanationError,
                )}
              </div>
            </div>
          )}

          {/* 세부 문법 항목 */}
          {combinedGrammar.length > 0 && (
            <div className="space-y-6">
              {combinedGrammar.map((grammarItem) => (
                <div key={grammarItem} className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-700 text-lg mb-3">
                    문법: {grammarItem}
                  </h3>
                  {grammarExplanations[grammarItem] ? (
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md text-base text-gray-700 whitespace-pre-wrap">
                      <div className="flex justify-between items-center mb-1">
                         <p className="font-semibold">AI 생성 설명:</p>
                         <button 
                          onClick={() => speakText(grammarExplanations[grammarItem])}
                          className="p-1 rounded-full hover:bg-indigo-200 text-indigo-600 transition-colors flex-shrink-0"
                          title="AI 생성 설명 듣기"
                        >
                          <Volume2 size={18} />
                        </button>
                      </div>
                      {grammarExplanations[grammarItem]}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => fetchGrammarExplanation(grammarItem, parseInt(unit.id), 'grammar')}
                        disabled={grammarExplanationLoading[grammarItem]}
                        className="mt-2 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-600 disabled:bg-indigo-300 transition-colors flex items-center"
                      >
                        <Lightbulb size={16} className="mr-2" /> AI 설명 보기
                      </button>
                      {grammarExplanationLoading[grammarItem] && <p className="text-sm text-indigo-600 mt-2">AI 설명을 불러오는 중...</p>}
                      {grammarExplanationError[grammarItem] && <p className="text-sm text-red-500 mt-2">오류: {grammarExplanationError[grammarItem]}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 어휘 연습 섹션 */}
        {unit.어휘 && unit.어휘.trim().length > 0 && (
          <section className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center">
              <BookText size={26} className="mr-3 text-indigo-500" /> 듣고 말하기와 읽기 연습
            </h2>
            {(unit.어휘.split(/[,、;]+/).map(word => word.trim()).filter(word => word.length > 0).map((word, idx) => (
              <div 
                key={idx} 
                className="mb-4 p-3 border border-gray-300 rounded-md bg-white shadow-sm" 
              >
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 font-medium text-lg">{word}</p>
                  <div>
                    <button 
                        onClick={() => speakText(word)} 
                        className="p-2 rounded-full hover:bg-sky-100 text-sky-500 transition-colors mr-1"
                        title={`${word} 듣기`}
                    >
                        <Volume2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleGenerateExamples(word)}
                        disabled={aiActivityLoading[word]}
                        className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-600 disabled:bg-indigo-300 transition-colors flex items-center"
                    >
                        <Lightbulb size={16} className="mr-2" /> AI 예문 보기
                    </button>
                  </div>
                </div>
                {aiActivityLoading[word] && (
                  <p className="text-xs text-sky-600 mt-1.5">AI 예문을 불러오는 중...</p>
                )}
                {aiActivityError[word] && (
                  <p className="text-xs text-red-500 mt-1.5">오류: {aiActivityError[word]}</p>
                )}
                {generatedExamples[word] && generatedExamples[word].length > 0 && (
                  <div className="mt-2 space-y-1 text-base text-gray-700">
                    {generatedExamples[word].map((exampleObj: any, exIdx: number) => (
                      <div key={exIdx} className="py-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start flex-grow">
                            <span className="mr-1.5 text-sky-500 flex-shrink-0">&bull;</span> 
                            <span className="flex-grow">{exampleObj.korean_sentence}</span>
                          </div>
                          <button 
                            onClick={() => speakText(exampleObj.korean_sentence)}
                            className="p-1 rounded-full hover:bg-sky-100 text-sky-500 transition-colors ml-2 flex-shrink-0"
                            title="예문 듣기"
                          >
                            <Volume2 size={18} />
                          </button>
                        </div>
                        {exampleObj.english_translation && (
                          <p className="ml-5 text-gray-500 text-sm mt-0.5">
                            ({exampleObj.english_translation})
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )))}
            {unit.related_keywords && unit.related_keywords.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-700 mb-2">연관 키워드</h3>
                <div className="flex flex-wrap gap-2">
                  {unit.related_keywords.map((keyword, index) => (
                    <div key={index} className="flex items-center bg-gray-100 p-2 rounded-md shadow-sm">
                      <span className="text-sm text-gray-600">{keyword}</span>
                      <button
                        onClick={() => speakText(keyword)}
                        className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                        title={`${keyword} 듣기`}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {learnedWordsLog.length > 0 && (
          <div className="mt-12 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <BookText size={24} className="mr-3 text-gray-600" />
              오늘 학습한 어휘
            </h2>
            <div className="flex flex-wrap gap-2">
              {learnedWordsLog.map((word, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 학습 완료 버튼 및 네비게이션 */}
        <div className="mt-16 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            
            {/* 이전 단원 */}
            <div className="w-full md:w-1/3 text-center md:text-left">
              {navigationInfo?.prevUnit ? (
                <Link href={`/learn/${navigationInfo.prevUnit.id}`} className="group inline-flex flex-col items-center md:items-start transition-opacity hover:opacity-80">
                  <span className="text-sm text-gray-500">이전 단원</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-2">
                    <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                    {navigationInfo.prevUnit.title}
                  </span>
                </Link>
              ) : <div className="h-10"></div>}
            </div>

            {/* 학습 완료 버튼 */}
            <div className="w-full md:w-1/3 flex justify-center">
              <button
                onClick={handleComplete}
                disabled={isCompleted || isSubmitting}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {isCompleted ? '✔️ 학습 완료됨' : (isSubmitting ? '저장 중...' : '학습 완료로 표시')}
              </button>
            </div>

            {/* 다음 단원 */}
            <div className="w-full md:w-1/3 text-center md:text-right">
              {navigationInfo?.nextUnit ? (
                <Link href={`/learn/${navigationInfo.nextUnit.id}`} className="group inline-flex flex-col items-center md:items-end transition-opacity hover:opacity-80">
                  <span className="text-sm text-gray-500">다음 단원</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-2">
                    {navigationInfo.nextUnit.title}
                    <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ) : <div className="h-10"></div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ActivitySection 컴포넌트는 이 수정으로 인해 사용되지 않으므로 주석 처리 또는 삭제 가능
/*
interface ActivitySectionProps { ... }
const ActivitySection: React.FC<ActivitySectionProps> = ({ ... }) => { ... };
*/