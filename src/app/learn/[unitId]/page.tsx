'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookText, Lightbulb, Mic, Headphones, Edit, Eye, Volume2, ChevronLeft, ChevronRight, PauseCircle } from 'lucide-react'

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

  // --- TTS 상태 관리 시스템 ---
  const [ttsState, setTtsState] = useState({ id: null as string | null, isPlaying: false, isPaused: false });
  const [isTTSSupported, setIsTTSSupported] = useState(false);
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  // ---

  // *** 여기로 함수를 옮겨서 먼저 선언되도록 합니다. ***
  const formatStructuredExplanation = (data: any): string => {
    // data 자체가 explanation 객체일 수도 있고, data.explanation에 있을 수도 있으므로 둘 다 확인합니다.
    const explanation = data.explanation || data;
    
    if (typeof explanation === 'string') {
        return explanation; // 이미 문자열이면 그대로 반환
    }

    if (!explanation || typeof explanation !== 'object') {
        // 고급 수업 계획 형식의 meta 데이터가 있는 경우, 아직 처리되지 않은 것으로 간주하지 않도록 수정
        if (data.meta) {
          // 이 경우는 아직 formatExplanationResult 에서 처리해야 함
        } else {
          return "설명 데이터를 처리할 수 없습니다.";
        }
    }

    // 새로운 고급(ADVANCED) 응답 형식 (phenomenon_summary) - 이전 버전 호환
    if (explanation.phenomenon_summary) {
      const summary = `[사회문화 현상 요약]\n${explanation.phenomenon_summary}`;
      const discussion = (explanation.discussion_points || []).map((p: any) => `[생각해볼 점: ${p.title}]\n- (제안) ${p.suggestion}\n- (질문) ${p.question}`).join('\n\n');
      const expressions = (explanation.related_expressions || []).length > 0 ? `[관련 표현]\n` + (explanation.related_expressions.map((e: any) => `- ${e.expression}: ${e.description}`).join('\n')) : '';
      const further = explanation.further_thought ? `[더 깊이 생각해보기]\n${explanation.further_thought}` : '';
      return [summary, discussion, expressions, further].filter(Boolean).join('\n\n\n');
    }
    
    // 고급(nuance_introduction) 응답 형식 처리 - 이전 버전 호환
    if (explanation.nuance_introduction) {
        const intro = `뉘앙스 소개\n${explanation.nuance_introduction}`;
        const implications = (explanation.socio_cultural_implications || []).map((item: any) => 
            `사회/문화적 함의: ${item.title}\n${item.explanation}\n예문: ${item.example.korean} (${item.example.english})`
        ).join('\n\n');
        const insight = `언어학적 관점\n${explanation.linguistic_insight}`;
        const pitfalls = `오류 피하기\n${explanation.avoiding_pitfalls}`;

        return [intro, implications, insight, pitfalls].filter(Boolean).join('\n\n\n');
    }
    
    // 초급/중급(introduction) 응답 형식 처리
    if (explanation.introduction) {
        const intro = explanation.introduction;
        const scenarios = (explanation.usage_scenarios || []).map((s: any, index: number) => `[용법 ${index + 1}] ${s.title}\n${s.explanation}\n예문: ${s.example.korean}  (${s.example.english})`).join('\n\n');
        const conjugation = explanation.conjugation_rules ? `[결합 규칙]\n${explanation.conjugation_rules}` : '';
        const mistakes = explanation.common_mistakes ? `[자주 하는 실수]\n${explanation.common_mistakes}` : '';
        return [intro, scenarios, conjugation, mistakes].filter(Boolean).join('\n\n');
    }
    
    // '고급' 수업 계획 형식 최종 추가
    if (data.advanced_explanation) {
      const { context_purpose, advanced_explanation, grammar_summary, example_sentences } = data;
      // 일반 텍스트 기반으로 포맷팅하여 UI 일관성 확보
      let content = `${context_purpose}\n\n[개요]\n${advanced_explanation.summary}\n\n`;
      
      content += `[심화 주제 토론]\n`;
      advanced_explanation.themes.forEach((theme: any, index: number) => {
        content += `${index + 1}. ${theme.title}\n${theme.description}\n`;
        theme.questions.forEach((q: string) => (content += `- ${q}\n`));
      });

      content += `\n[문법 요약]\n${grammar_summary.description}\n`;
      grammar_summary.expressions.forEach((exp: any) => {
        content += `- ${exp.form}: ${exp.meaning}\n  (예: ${exp.example})\n`;
      });
      
      content += `\n[응용 예문]\n`;
      example_sentences.forEach((sent: string) => (content += `- ${sent}\n`));
      
      return content.replace(/\*+/g, ''); // Markdown Bold/Italic 제거
    }

    // 새로운 통합 형식 (grammer_and_structure)
    if (explanation && explanation.grammar_and_structure) {
      let content = `${explanation.overall_meaning}\n\n`;
      content += `[문법과 문장 구조]\n${explanation.grammar_and_structure}\n`;
      
      content += `\n[응용 예문]\n`;
      explanation.practical_examples.forEach((ex: any) => {
        if (ex.title && ex.example?.korean && ex.example?.english) {
          content += `- ${ex.title}: ${ex.example.korean} (${ex.example.english})\n`;
        } else if (ex.example?.korean && ex.example?.english) {
          content += `- ${ex.example.korean} (${ex.example.english})\n`;
        }
      });
      return content.replace(/\*+/g, '');
    }

    // 초/중급 새로 추가된 형식
    if (explanation && explanation.grammatical_breakdown) {
      let content = `${explanation.overall_meaning}\n\n`;
      content += `[문법 분석]\n`;
      explanation.grammatical_breakdown.forEach((b: any) => {
        content += `- ${b.grammar_point}: ${b.explanation} (결합 규칙: ${b.conjugation})\n`;
      });
      if (explanation.sentence_structure_analysis) {
        content += `\n[문장 구조]\n${explanation.sentence_structure_analysis}\n`;
      }
      content += `\n[응용 예문]\n`;
      explanation.practical_examples.forEach((ex: any) => {
        if (ex.title && ex.example?.korean && ex.example?.english) {
          content += `- ${ex.title}: ${ex.example.korean} (${ex.example.english})\n`;
        } else if (ex.example?.korean && ex.example?.english) {
          content += `- ${ex.example.korean} (${ex.example.english})\n`;
        }
      });
      return content.replace(/\*+/g, '');
    }

    // 어떤 형식에도 맞지 않을 경우, 원본 객체를 문자열로 변환하여 반환
    return JSON.stringify(data, null, 2);
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
    "저는 한국 사람이에요.": { // unit.제목이 이 문자열과 일치할 경우
      title: "저는 한국 사람이에요.",
      explanation: "이 문장은 자신을 소개할 때 사용하는 기본적인 표현입니다. '저'는 자신을 낮추어 부르는 말이고, '는'은 문장의 주제를 나타냅니다. '한국 사람'은 국적을, '이에요'는 명사 뒤에 붙어 '입니다'와 같이 서술하는 역할을 합니다. 이 문장에서는 주로 'N은/는' 토픽 조사와 'N이다' 서술격 조사의 활용을 배웁니다."
    }
    // 다른 unit.제목에 대한 설명을 추가할 수 있습니다.
  };

  // TTS 함수 복원 및 개선 (lang 파라미터 추가)
  const speakText = (text: string, lang: string = 'ko-KR') => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // 진행 중인 음성 취소
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang; // 'ko-KR' 또는 'en-US' 등
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('죄송합니다. 사용하시는 브라우저가 음성 합성을 지원하지 않습니다.');
      console.log('[ULP_DEBUG] Speech synthesis not supported');
    }
  };

  // 한국어와 영어를 순차적으로 재생하는 새로운 함수
  const speakSentencePair = (korean: string, english: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // 진행 중인 음성 취소

      const koreanUtterance = new SpeechSynthesisUtterance(korean);
      koreanUtterance.lang = 'ko-KR';
      koreanUtterance.rate = 1.0;
      koreanUtterance.pitch = 1.0;

      const englishUtterance = new SpeechSynthesisUtterance(english);
      englishUtterance.lang = 'en-US';
      englishUtterance.rate = 1.0;
      englishUtterance.pitch = 1.0;

      // 한국어 음성이 끝나면 영어 음성을 재생
      koreanUtterance.onend = () => {
        window.speechSynthesis.speak(englishUtterance);
      };

      window.speechSynthesis.speak(koreanUtterance);
    } else {
      alert('죄송합니다. 사용하시는 브라우저가 음성 합성을 지원하지 않습니다.');
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
    // TTS 지원 여부 확인
    const checkTTSSupport = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          // 간단한 테스트로 TTS 지원 확인
          const testUtterance = new SpeechSynthesisUtterance('');
          setIsTTSSupported(true);
          console.log('[TTS] Speech synthesis is supported');
        } catch (error) {
          console.warn('[TTS] Speech synthesis not supported:', error);
          setIsTTSSupported(false);
        }
      } else {
        console.warn('[TTS] Speech synthesis API not available');
        setIsTTSSupported(false);
      }
    };

    checkTTSSupport();

    const storedLearnedWords = localStorage.getItem('learnedWordsLog');
    if (storedLearnedWords) {
      setLearnedWordsLog(JSON.parse(storedLearnedWords));
    }

    // fetchUnitDetails와 fetchNavigationInfo 함수를 useEffect 내부에 정의
    async function fetchNavigationInfo(currentUnitId: string) {
      try {
        const res = await fetch(`/api/koreantraining/navigation/${currentUnitId}`);
        if (!res.ok) throw new Error('Failed to fetch navigation info');
        const data = await res.json();
        setNavigationInfo(data);
      } catch (err: any) {
        console.error("[ULP_ERROR] Fetching navigation info failed:", err);
        // 에러가 발생해도 다른 기능은 계속 작동하도록 상태를 null로 유지
        setNavigationInfo(null);
      }
    }

    async function fetchUnitDetails() {
      if (!unitId) return;
      console.log(`[ULP_DEBUG] fetchUnitDetails called for unitId: ${unitId}`);
      setLoading(true);
      setError(null);
      try {
        await fetchNavigationInfo(unitId);

        const response = await fetch(`/api/koreantraining/unit/${unitId}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[ULP_ERROR] Failed to fetch unit details. Status: ${response.status}, Response: ${errorText}`);
          throw new Error(`서버에서 단원 정보를 불러오는 데 실패했습니다 (상태 코드: ${response.status})`);
        }
        
        const data: UnitDetails = await response.json();
        
        if (!data) {
          throw new Error("해당 ID의 단원을 찾을 수 없습니다.");
        }

        console.log("[ULP_DATA] Fetched unit data:", data);
        setUnit(data);
        
        const repCourse = getRepresentativeCourseName(data.과목);
        if (repCourse) {
          const newLink = `/courses?course=${encodeURIComponent(repCourse)}&level=${encodeURIComponent(data.단계)}`;
          updateBackLink(newLink, "fetchUnitDetails - repCourse found");
        } else {
          updateBackLink('/courses', "fetchUnitDetails - repCourse not found");
        }

        const splitAndTrim = (str: string) => str.split(';').map(s => s.trim()).filter(s => s.length > 0);
        
        const grammarSet = new Set<string>();
        if (data.문법 && data.문법.trim() !== '-') {
          splitAndTrim(data.문법).forEach(item => grammarSet.add(item));
        }
        if (data.부가문법 && data.부가문법.trim() !== '-') {
          splitAndTrim(data.부가문법).forEach(item => grammarSet.add(item));
        }
        setCombinedGrammar(Array.from(grammarSet));

        // --- 고급 레벨 주요 표현 AI 설명 로직 복원 ---
        const predefinedExp = unitKeySentenceExplanation[data.제목];
        if (predefinedExp) {
            setAiUnitTitleExplanation(predefinedExp.explanation);
        } else {
            setAiUnitTitleExplanationLoading(true);
            setAiUnitTitleExplanationError(null);
            const isAdvanced = data.과목.startsWith('고급');

            try {
                const res = await fetch('/api/generate-grammar-explanation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        grammarItem: data.제목,
                        unitId: data.id,
                        unitLevel: data.단계,
                        isMainExpression: isAdvanced // 고급일 경우에만 true, 아니면 false
                    }),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `AI 설명 생성 실패 (상태: ${res.status})`);
                }

                const result = await res.json();
                const formatted = formatStructuredExplanation(result);
                setAiUnitTitleExplanation(formatted);
                setGrammarExplanations(prev => ({ ...prev, [data.제목]: formatted }));
            } catch (err: any) {
                console.error('[ULP_ERROR] Fetching AI explanation for unit title failed:', err);
                setAiUnitTitleExplanationError(err.message);
            } finally {
                setAiUnitTitleExplanationLoading(false);
            }
        }
        // --- 로직 복원 끝 ---

      } catch (err: any) {
        console.error('[ULP_ERROR] An error occurred in fetchUnitDetails:', err);
        setError(err.message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchUnitDetails();
  }, [unitId]); // 의존성 배열에 unitId만 유지

  // [NEW] Automatically fetch existing grammar explanations on load
  useEffect(() => {
    const fetchInitialExplanations = async () => {
      if (combinedGrammar.length === 0) return;

      console.log("[ULP_DEBUG] Fetching initial explanations for:", combinedGrammar);
      const initialExplanations: Record<string, string> = {};
      for (const grammarItem of combinedGrammar) {
        // 먼저 기본 설명을 확인
        if (predefinedGrammarDetails[grammarItem]) {
          initialExplanations[grammarItem] = predefinedGrammarDetails[grammarItem].basicExplanation;
        } else {
          // 기본 설명이 없으면 DB에서 AI가 생성한 설명을 찾음
          try {
            const dbQueryGrammar = encodeURIComponent(grammarItem);
            const response = await fetch(`/api/grammar-explanations/${dbQueryGrammar}?lang=ko`);
            if (response.ok) {
              const dbData = await response.json();
              if (dbData && dbData.explanation) {
                // [FIX] DB에서 받은 JSON 객체를 렌더링 가능한 문자열로 변환
                initialExplanations[grammarItem] = formatStructuredExplanation(dbData.explanation);
              }
            }
          } catch (error) {
            console.error(`[ULP_ERROR] Error fetching initial explanation for ${grammarItem}:`, error);
          }
        }
      }
      setGrammarExplanations(initialExplanations);
      console.log("[ULP_DEBUG] Initial explanations loaded:", initialExplanations);
    };

    fetchInitialExplanations();
  }, [combinedGrammar]);

  const addWordToLog = (word: string) => {
    const newLog = [...learnedWordsLog, word];
    setLearnedWordsLog(newLog);
    localStorage.setItem('learnedWordsLog', JSON.stringify(newLog));
  };

  const fetchGrammarExplanation = async (grammarItem: string, currentUnitId: number) => {
    // 이미 설명이 있거나 로딩 중이면 다시 호출하지 않음
    if (grammarExplanations[grammarItem] || grammarExplanationLoading[grammarItem]) {
      return;
    }

    console.log(`[ULP_AI_FETCH] Fetching explanation for "${grammarItem}"`);
    setGrammarExplanationLoading(prev => ({ ...prev, [grammarItem]: true }));
    setGrammarExplanationError(prev => ({ ...prev, [grammarItem]: null }));

    try {
      const response = await fetch('/api/generate-grammar-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grammarItem: grammarItem,
          unitId: currentUnitId,
          // 백엔드가 스스로 판단하므로 아래 정보들은 더 이상 필요 없음
          // unitLevel: unit?.단계,
          // isMainExpression: isAdvanced ? false : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[ULP_ERROR] AI explanation fetch failed for "${grammarItem}":`, errorData.error);
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      const result = await response.json();
      console.log(`[ULP_AI_RESULT] Explanation for "${grammarItem}":`, result);
      
      const formattedExplanation = formatStructuredExplanation(result);
      
      setGrammarExplanations(prev => ({ ...prev, [grammarItem]: formattedExplanation }));

    } catch (err: any) {
      console.error(`[ULP_ERROR] Error in fetchGrammarExplanation for "${grammarItem}":`, err);
      setGrammarExplanationError(prev => ({ ...prev, [grammarItem]: err.message }));
    } finally {
      setGrammarExplanationLoading(prev => ({ ...prev, [grammarItem]: false }));
    }
  };

  const handleGenerateExamples = async (prompt: string) => {
    // 'prompt'를 키로 사용하도록 상태 업데이트
    setAiActivityLoading(prev => ({ ...prev, [prompt]: true }));
    setAiActivityError(prev => ({ ...prev, [prompt]: null }));
    setGeneratedExamples(prev => ({ ...prev, [prompt]: [] }));

    addWordToLog(prompt);

    try {
      const response = await fetch('/api/generate-examples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt, // 'word' 대신 'prompt'를 사용
          context: {
            unitTopic: unit?.주제,
            unitTitle: unit?.제목,
            relatedWords: unit?.related_keywords
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI 예문 생성에 실패했습니다.');
      }

      setGeneratedExamples(prev => ({ ...prev, [prompt]: data.examples }));
    } catch (err: any) {
      setAiActivityError(prev => ({ ...prev, [prompt]: err.message }));
    } finally {
      setAiActivityLoading(prev => ({ ...prev, [prompt]: false }));
    }
  };

  // --- 새로운 통합 TTS 핸들러 ---
  const playNextInQueue = () => {
    // 브라우저 호환성 체크
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[TTS] Speech synthesis not supported in this environment');
      setTtsState({ id: null, isPlaying: false, isPaused: false });
      return;
    }

    if (utteranceQueueRef.current.length > 0) {
      const utterance = utteranceQueueRef.current.shift();
      if (utterance) {
        // 현재 재생이 중지되거나 다른 항목으로 넘어간 경우 큐를 중단
        if (!ttsState.id) {
          utteranceQueueRef.current = [];
          return;
        }
        utterance.onend = playNextInQueue;
        
        // 에러 핸들링 추가
        utterance.onerror = (event) => {
          console.error('[TTS] Speech synthesis error:', event);
          setTtsState({ id: null, isPlaying: false, isPaused: false });
        };
        
        try {
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('[TTS] Failed to speak:', error);
          setTtsState({ id: null, isPlaying: false, isPaused: false });
        }
      }
    } else {
      setTtsState({ id: null, isPlaying: false, isPaused: false }); // 모든 큐 재생 완료
    }
  };

  const handleTTS = (id: string, ...texts: string[]) => {
    // 브라우저 호환성 체크
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('죄송합니다. 현재 환경에서는 음성 합성 기능을 사용할 수 없습니다.');
      console.warn('[TTS] Speech synthesis not supported in this environment');
      return;
    }

    const { id: currentId, isPlaying } = ttsState;

    try {
      if (isPlaying && currentId === id) {
        // 현재 재생 중인 것을 일시정지
        window.speechSynthesis.pause();
        setTtsState({ id, isPlaying: false, isPaused: true });
      } else if (!isPlaying && currentId === id) { 
        // 현재 일시정지된 것을 재개
        window.speechSynthesis.resume();
        setTtsState({ id, isPlaying: true, isPaused: false });
      } else {
        // 다른 것을 재생하거나 새로 시작
        window.speechSynthesis.cancel();
        utteranceQueueRef.current = [];

        const languages = ['ko-KR', 'en-US'];
        texts.forEach((text, index) => {
          if (!text) return;

          const lang = languages[index] || 'ko-KR';
          
          // 긴 텍스트를 문장 또는 적절한 단위로 분할 (chunking)
          const chunks = text.match(/[^.!?]+[.!?]*/g) || [text];
          
          chunks.forEach(chunk => {
            if (chunk.trim()) {
              const utterance = new SpeechSynthesisUtterance(chunk);
              utterance.lang = lang;
              utterance.rate = lang === 'ko-KR' ? 1.1 : 1.0; // 한국어는 1.1 속도, 영어는 1.0 속도
              utterance.pitch = 1.0;
              utterance.volume = 1.0;
              utteranceQueueRef.current.push(utterance);
            }
          });
        });
        
        setTtsState({ id, isPlaying: true, isPaused: false });
        playNextInQueue();
      }
    } catch (error) {
      console.error('[TTS] Error in handleTTS:', error);
      alert('음성 재생 중 오류가 발생했습니다.');
      setTtsState({ id: null, isPlaying: false, isPaused: false });
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

  const currentKeySentenceExplanation = unitKeySentenceExplanation[unit.제목] || { title: unit.제목, explanation: "AI 설명을 생성 중이거나, 미리 정의된 설명이 없습니다." };

  const predefinedExplanation = currentKeySentenceExplanation.explanation;
  const explanationText = predefinedExplanation || aiUnitTitleExplanation;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href={backLink} className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm">
                <ArrowLeft size={18} className="mr-1" />
                <span className="hidden sm:inline">과목으로 돌아가기</span>
                <span className="sm:hidden">과목</span>
              </Link>
            </div>
            <div className="text-sm sm:text-base font-medium text-gray-700 truncate mx-4 text-center flex-1" title={`${unit.과목} - ${unit.단계} / ${unit.주제}`}>
                {`${unit.제목 || unit.주제}`}
            </div>
            {/* 이전/다음 단원 네비게이션 버튼 영역 */}
            <div className="flex items-center space-x-1">
             {navigationInfo?.prevUnit ? (
                <Link
                  href={`/learn/${navigationInfo.prevUnit.id}`}
                  className="flex items-center text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md transition-colors text-sm"
                  title={`이전: ${navigationInfo.prevUnit.title}`}
                >
                  <ChevronLeft size={14} className="mr-1" />
                  <span className="hidden sm:inline">이전</span>
                </Link>
              ) : (
                <div className="flex items-center text-gray-400 px-2 py-1 rounded-md cursor-not-allowed text-sm">
                  <ChevronLeft size={14} className="mr-1" />
                  <span className="hidden sm:inline">이전</span>
                </div>
              )}
             {navigationInfo?.nextUnit ? (
                <Link
                  href={`/learn/${navigationInfo.nextUnit.id}`}
                  className="flex items-center text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md transition-colors text-sm"
                  title={`다음: ${navigationInfo.nextUnit.title}`}
                >
                  <span className="hidden sm:inline">다음</span>
                  <ChevronRight size={14} className="ml-1" />
                </Link>
              ) : (
                <div className="flex items-center text-gray-400 px-2 py-1 rounded-md cursor-not-allowed text-sm">
                  <span className="hidden sm:inline">다음</span>
                  <ChevronRight size={14} className="ml-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* 단원 정보 헤더 */}
        <div className="bg-blue-600 text-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">{courseName} - {unit.단계}</h1>
          <p className="text-base sm:text-lg mb-1">주제: {unit.주제}</p>
          <p className="text-sm sm:text-base">주요 표현: {unit.제목}</p>
        </div>

        {/* --- 단원 해설 (구: 문법) 섹션 --- */}
        <div id="grammar" className="card mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
            <BookText className="mr-2 sm:mr-3 text-green-500" size={20} />
            단원 해설
          </h2>

          {/* 주요 표현 설명 */}
          <div className="mt-6 sm:mt-8 mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex justify-between items-start">
              <div className="flex-grow pr-4">
                <div className="flex items-center mb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mr-3">
                    주요 표현: {unit.제목}
                  </h3>
                  {isTTSSupported && (aiUnitTitleExplanation || unitKeySentenceExplanation[unit.제목]?.explanation) && !aiUnitTitleExplanationLoading && (
                    <button 
                        onClick={() => handleTTS('main_explanation', `주요 표현: ${unit.제목}. ${aiUnitTitleExplanation || unitKeySentenceExplanation[unit.제목]?.explanation || ''}`)} 
                        className="text-yellow-600 hover:text-yellow-800 transition-colors"
                        title="전체 내용 듣기"
                    >
                        {ttsState.isPlaying && ttsState.id === 'main_explanation' ? <PauseCircle size={20} /> : <Volume2 size={20} />}
                    </button>
                  )}
                  {!isTTSSupported && (aiUnitTitleExplanation || unitKeySentenceExplanation[unit.제목]?.explanation) && !aiUnitTitleExplanationLoading && (
                    <span className="text-gray-400 text-sm ml-2" title="이 환경에서는 음성 기능을 지원하지 않습니다">
                      🔇
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                  {renderExplanation(
                      unitKeySentenceExplanation[unit.제목]?.explanation,
                      aiUnitTitleExplanation,
                      aiUnitTitleExplanationLoading,
                      aiUnitTitleExplanationError
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 세부 문법 항목 */}
          {combinedGrammar.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              {combinedGrammar.map((grammarItem) => {
                const itemId = `grammar_${grammarItem}`;
                return (
                <div key={grammarItem} className="p-4 sm:p-6 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mr-3">
                      문법: {grammarItem}
                    </h3>
                    {isTTSSupported && grammarExplanations[grammarItem] && !grammarExplanationLoading[grammarItem] && (
                         <button 
                            onClick={() => handleTTS(itemId, `문법: ${grammarItem}. ${grammarExplanations[grammarItem] || ''}`)} 
                            className="text-yellow-600 hover:text-yellow-800 transition-colors"
                            title="전체 내용 듣기"
                        >
                            {ttsState.isPlaying && ttsState.id === itemId ? <PauseCircle size={20} /> : <Volume2 size={20} />}
                        </button>
                    )}
                    {!isTTSSupported && grammarExplanations[grammarItem] && !grammarExplanationLoading[grammarItem] && (
                      <span className="text-gray-400 text-sm ml-2" title="이 환경에서는 음성 기능을 지원하지 않습니다">
                        🔇
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                    {grammarExplanationLoading[grammarItem] ? '...' : grammarExplanations[grammarItem] || '...'}
                  </p>


                  {/* AI 설명 요청 버튼 */}
                  <button 
                    onClick={() => fetchGrammarExplanation(grammarItem, parseInt(unitId))}
                    disabled={!unitId || grammarExplanationLoading[grammarItem]}
                    className="mt-4 w-full text-left p-2 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors disabled:bg-gray-200 disabled:text-gray-500 text-sm sm:text-base"
                  >
                    AI로 더 자세한 설명 보기
                  </button>
                </div>
              )})}
            </div>
          )}
        </div>
        
        {/* --- 듣고 말하기와 읽기 연습 섹션 --- */}
        <section className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-5 flex items-center">
            <BookText size={22} className="mr-2 sm:mr-3 text-indigo-500" /> 듣고 말하기와 읽기 연습
          </h2>

          {/* 주제에 대한 AI 예문 생성 섹션 */}
          <div className="p-4 border rounded-lg mb-4 sm:mb-6 bg-indigo-50">
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-medium text-gray-800">{unit.주제}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleGenerateExamples(unit.주제)}
                  disabled={aiActivityLoading[unit.주제]}
                  className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-wait transition-colors flex items-center"
                >
                  <Lightbulb size={12} className="mr-1.5" />
                  AI 예문 보기
                </button>
              </div>
            </div>
            {aiActivityLoading[unit.주제] && (
              <div className="mt-3 text-center text-xs sm:text-sm text-gray-500">AI 예문을 생성하는 중...</div>
            )}
            {aiActivityError[unit.주제] && (
              <div className="mt-3 text-xs sm:text-sm text-red-500 bg-red-50 p-3 rounded-md">
                <strong>오류:</strong> {aiActivityError[unit.주제]}
              </div>
            )}
            {generatedExamples[unit.주제] && generatedExamples[unit.주제].length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <ul className="space-y-3">
                  {generatedExamples[unit.주제].map((ex: any, i: number) => {
                    const itemId = `topic_ex_${i}`;
                    let sentence = '';
                    let translation = '';

                    if (typeof ex === 'object' && ex !== null) {
                      sentence = ex.korean || ex.sentence || ex.expression || ex.korean_sentence || JSON.stringify(ex);
                      translation = ex.english || ex.translation || ex.english_translation || '';
                    } else {
                      sentence = String(ex);
                    }

                    return (
                      <li key={i} className="flex items-start p-2 rounded-md hover:bg-gray-100">
                        <span className="mr-2 text-purple-500 pt-1">&#8226;</span>
                        <div className="flex-grow">
                          <p className="text-sm sm:text-base text-gray-800">{sentence}</p>
                          {translation && (
                            <p className="text-xs sm:text-sm text-gray-500">({translation})</p>
                          )}
                        </div>
                        {isTTSSupported && translation && (
                          <button onClick={() => handleTTS(itemId, sentence, translation)} className="ml-2 p-1 text-gray-500 hover:text-gray-800 transition-colors self-center" title="한국어와 영어 듣기">
                            {ttsState.isPlaying && ttsState.id === itemId ? <PauseCircle size={16} /> : <Volume2 size={16} />}
                          </button>
                        )}
                        {!isTTSSupported && translation && (
                          <span className="ml-2 p-1 text-gray-400" title="이 환경에서는 음성 기능을 지원하지 않습니다">
                            🔇
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* 어휘 목록 섹션 복원 */}
          <div className="space-y-4">
            {(unit.어휘 || '').split(';').map(word => word.trim()).filter(Boolean).map(word => (
              <div key={word} className="p-4 border rounded-lg transition-all duration-300 ease-in-out hover:shadow-md hover:border-indigo-300">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-medium text-gray-800">{word}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleGenerateExamples(word)}
                      disabled={aiActivityLoading[word]}
                      className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-wait transition-colors flex items-center"
                    >
                      <Lightbulb size={12} className="mr-1.5" />
                      AI 예문 보기
                    </button>
                  </div>
                </div>
                {aiActivityLoading[word] && (
                  <div className="mt-3 text-center text-xs sm:text-sm text-gray-500">AI 예문을 생성하는 중...</div>
                )}
                {aiActivityError[word] && (
                  <div className="mt-3 text-xs sm:text-sm text-red-500 bg-red-50 p-3 rounded-md">
                    <strong>오류:</strong> {aiActivityError[word]}
                  </div>
                )}
                {generatedExamples[word] && generatedExamples[word].length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <ul className="space-y-3">
                      {generatedExamples[word].map((ex: any, i: number) => {
                        const itemId = `vocab_ex_${word}_${i}`;
                        let sentence = '';
                        let translation = '';

                        if (typeof ex === 'object' && ex !== null) {
                          sentence = ex.korean || ex.sentence || ex.expression || ex.korean_sentence || JSON.stringify(ex);
                          translation = ex.english || ex.translation || ex.english_translation || '';
                        } else {
                          sentence = String(ex);
                        }

                        return (
                          <li key={i} className="flex items-start p-2 rounded-md hover:bg-gray-100">
                            <span className="mr-2 text-purple-500 pt-1">&#8226;</span>
                            <div className="flex-grow">
                              <p className="text-sm sm:text-base text-gray-800">{sentence}</p>
                              {translation && (
                                <p className="text-xs sm:text-sm text-gray-500">({translation})</p>
                              )}
                            </div>
                            {isTTSSupported && translation && (
                              <button onClick={() => handleTTS(itemId, sentence, translation)} className="ml-2 p-1 text-gray-500 hover:text-gray-800 transition-colors self-center" title="한국어와 영어 듣기">
                                {ttsState.isPlaying && ttsState.id === itemId ? <PauseCircle size={16} /> : <Volume2 size={16} />}
                              </button>
                            )}
                            {!isTTSSupported && translation && (
                              <span className="ml-2 p-1 text-gray-400" title="이 환경에서는 음성 기능을 지원하지 않습니다">
                                🔇
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 관련 키워드 */}
          {unit.related_keywords && unit.related_keywords.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">연관 키워드</h3>
              <div className="flex flex-wrap gap-2">
                {unit.related_keywords.map((keyword, index) => (
                  <div key={index} className="flex items-center bg-gray-100 p-2 rounded-md shadow-sm">
                    <span className="text-xs sm:text-sm text-gray-600">{keyword}</span>
                    {isTTSSupported && (
                      <button
                        onClick={() => handleTTS(`keyword_${index}`, keyword)}
                        className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                        title={`${keyword} 듣기`}
                      >
                        {ttsState.isPlaying && ttsState.id === `keyword_${index}` ? <PauseCircle size={14} /> : <Volume2 size={14} />}
                      </button>
                    )}
                    {!isTTSSupported && (
                      <span className="ml-2 p-1 text-gray-400" title="이 환경에서는 음성 기능을 지원하지 않습니다">
                        🔇
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {learnedWordsLog.length > 0 && (
          <div className="mt-8 sm:mt-12 p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <BookText size={20} className="mr-2 sm:mr-3 text-gray-600" />
              오늘 학습한 어휘
            </h2>
            <div className="flex flex-wrap gap-2">
              {learnedWordsLog.map((word, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs sm:text-sm rounded-full">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

