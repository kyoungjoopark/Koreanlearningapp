'use client'

import { useState, useEffect } from 'react'

interface TTSButtonProps {
  text: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// 영어 감지를 위한 정규식 (기본 라틴 알파벳 포함)
const ENGLISH_REGEX = /[a-zA-Z]/;

export default function TTSButton({ 
  text, 
  className = '', 
  size = 'md' 
}: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSupported, setIsSupported] = useState(false)
  const [userStopped, setUserStopped] = useState(false) // 사용자가 직접 중지했는지 추적

  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // 모바일 호환성을 고려한 TTS 지원 확인
      const checkTTSSupport = () => {
        try {
          const hasAPI = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
          
          // 모바일 디바이스 감지
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          console.log('[TTS] Device type:', isMobile ? 'Mobile' : 'Desktop');
          
          setIsSupported(hasAPI);
          console.log('[TTS] Speech synthesis API available:', hasAPI);
        } catch (error) {
          console.error('[TTS] Error checking speech synthesis:', error);
          setIsSupported(false);
        }
      };
      
      const loadVoices = () => {
        try {
          const availableVoices = window.speechSynthesis.getVoices();
          console.log('[TTS] Available voices:', availableVoices.length);
          
          // 모바일에서는 voices가 비동기적으로 로드될 수 있으므로 재시도
          if (availableVoices.length === 0) {
            console.log('[TTS] No voices loaded yet, will retry...');
            setTimeout(() => {
              const retryVoices = window.speechSynthesis.getVoices();
              console.log('[TTS] Retry - Available voices:', retryVoices.length);
              setVoices(retryVoices);
            }, 1000);
          } else {
            setVoices(availableVoices);
          }
        } catch (error) {
          console.error("Error loading voices:", error);
        }
      };

      // 초기 지원 여부 확인
      checkTTSSupport();
      
      // 음성 로딩 (모바일 호환성 개선)
      loadVoices();
      
      // 모바일에서 voices 로딩이 지연될 수 있으므로 여러 번 시도
      const voiceLoadInterval = setInterval(() => {
        if (voices.length === 0) {
          loadVoices();
        } else {
          clearInterval(voiceLoadInterval);
        }
      }, 500);
      
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        try {
          clearInterval(voiceLoadInterval);
          window.speechSynthesis.onvoiceschanged = null;
          // 컴포넌트 언마운트 시 재생 중인 음성 중지
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }
        } catch (error) {
          console.error("Error cleaning up TTS:", error);
        }
      };
    } else {
      console.log("Speech Synthesis API not supported");
      setIsSupported(false);
    }
  }, [voices.length]);

  const cleanTextForTTS = (inputText: string): string => {
    // 1. 기본 마크다운 및 포맷팅 제거
    let cleaned = inputText.replace(/(\*\*|\*|\[.*?\])/g, '');
    
    // 2. 사용자 요청 특수 기호 제거: "( )", ",", "/", "-", "~"
    // 괄호는 제거하되 괄호 안의 내용은 유지
    cleaned = cleaned.replace(/[()]/g, ' '); // 괄호만 제거
    cleaned = cleaned.replace(/[,\/\-~]/g, ' '); // 다른 특수 기호 제거
    
    // 3. 여러 공백을 단일 공백으로 변환
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // 4. 앞뒤 공백 제거
    cleaned = cleaned.trim();
    
    console.log('[TTS] Original text:', inputText);
    console.log('[TTS] Cleaned text (Korean + English):', cleaned);
    
    return cleaned;
  };

  // 텍스트를 한국어와 영어 부분으로 분리
  const splitTextByLanguage = (text: string): Array<{text: string, lang: string}> => {
    const segments = [];
    const words = text.split(/\s+/);
    let currentSegment = '';
    let currentLang = '';
    
    for (const word of words) {
      if (!word.trim()) continue;
      
      // 단어가 영어인지 한국어인지 판단
      const isEnglish = /[a-zA-Z]/.test(word);
      const wordLang = isEnglish ? 'en-US' : 'ko-KR';
      
      if (currentLang === '' || currentLang === wordLang) {
        // 같은 언어이거나 첫 단어인 경우
        currentSegment += (currentSegment ? ' ' : '') + word;
        currentLang = wordLang;
      } else {
        // 언어가 바뀐 경우, 이전 세그먼트 저장하고 새 세그먼트 시작
        if (currentSegment.trim()) {
          segments.push({ text: currentSegment.trim(), lang: currentLang });
        }
        currentSegment = word;
        currentLang = wordLang;
      }
    }
    
    // 마지막 세그먼트 추가
    if (currentSegment.trim()) {
      segments.push({ text: currentSegment.trim(), lang: currentLang });
    }
    
    return segments;
  };

  // 세그먼트들을 순차적으로 재생
  const playSegments = (segments: Array<{text: string, lang: string}>, index: number) => {
    if (index >= segments.length) {
      setIsPlaying(false);
      setUserStopped(false);
      console.log('[TTS] All segments completed');
      return;
    }
    
    const segment = segments[index];
    const utterance = new SpeechSynthesisUtterance(segment.text);
    
    utterance.lang = segment.lang;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // 언어별 설정
    if (segment.lang === 'en-US') {
      utterance.rate = 1.0; // 영어는 일반 속도
      // 미국식 영어 음성 찾기
      const usVoice = voices.find(voice => 
        voice.lang === 'en-US' && 
        (voice.name.includes('US') || voice.name.includes('United States'))
      );
      if (usVoice) {
        utterance.voice = usVoice;
      }
    } else {
      utterance.rate = 0.9; // 한국어는 약간 느리게
      // 한국어 음성 찾기
      const koVoice = voices.find(voice => voice.lang === 'ko-KR');
      if (koVoice) {
        utterance.voice = koVoice;
      }
    }
    
    utterance.onstart = () => {
      if (index === 0) {
        setIsPlaying(true);
      }
      console.log(`[TTS] Playing segment ${index + 1}/${segments.length}: "${segment.text}" (${segment.lang})`);
    };
    
    utterance.onend = () => {
      console.log(`[TTS] Completed segment ${index + 1}/${segments.length}`);
      // 다음 세그먼트 재생
      playSegments(segments, index + 1);
    };
    
    utterance.onerror = (event) => {
      console.error(`[TTS] Error in segment ${index + 1}:`, event.error);
      setIsPlaying(false);
      setUserStopped(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeech = async () => {
    console.log('[TTSButton] Button clicked, text received:', text);
    console.log('[TTSButton] Text length:', text?.length);
    
    if (!isSupported) {
      console.warn('[TTSButton] Speech synthesis not supported in this environment');
      return;
    }

    try {
      if (isPlaying) {
        setUserStopped(true); // 사용자가 직접 중지함을 표시
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }

      if (!text) {
        console.warn("[TTSButton] Text is empty, cannot proceed");
        return;
      }

      // 모바일 디바이스 감지
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // 재생 전 기존 음성 정지
      window.speechSynthesis.cancel();
      setUserStopped(false);

      const cleanedText = cleanTextForTTS(text);
      
      if (!cleanedText) {
        console.warn("No readable text after cleaning.");
        return;
      }

      // 모바일에서는 User Gesture가 필요하므로 즉시 실행
      if (isMobile) {
        console.log('[TTS] Mobile device detected - using immediate execution');
        
        // 간단한 단일 utterance 방식 (모바일 호환성 향상)
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        
        // 한국어 우선 설정 (대부분의 텍스트가 한국어)
        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // 한국어 음성 찾기 (모바일에서 더 안정적)
        const koVoice = voices.find(voice => voice.lang === 'ko-KR') || voices[0];
        if (koVoice) {
          utterance.voice = koVoice;
          console.log('[TTS] Using voice:', koVoice.name, koVoice.lang);
        }
        
        utterance.onstart = () => {
          setIsPlaying(true);
          console.log('[TTS] Mobile playback started');
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
          setUserStopped(false);
          console.log('[TTS] Mobile playback completed');
        };
        
        utterance.onerror = (event) => {
          console.error('[TTS] Mobile playback error:', event.error);
          setIsPlaying(false);
          setUserStopped(false);
        };
        
        // 모바일에서는 즉시 재생 (User Gesture 보장)
        window.speechSynthesis.speak(utterance);
        
      } else {
        console.log('[TTS] Desktop device - using advanced segmentation');
        
        // 데스크톱에서는 기존의 고급 기능 사용
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const segments = splitTextByLanguage(cleanedText);
        console.log('[TTS] Text segments:', segments);
        
        if (segments.length === 0) {
          console.warn("No readable segments after processing.");
          return;
        }
        
        playSegments(segments, 0);
      }
      
    } catch (error) {
      console.error("Error in TTS:", error);
      setIsPlaying(false);
      setUserStopped(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-5 h-5 text-xs'  // 16px → 20px (20% 증가)
      case 'lg':
        return 'w-8 h-8 text-base'
      default:
        return 'w-6 h-6 text-sm'
    }
  }

  // 지원되지 않는 환경에서는 회색 X 아이콘 표시
  if (!isSupported) {
    return (
      <button
        disabled
        className={`
          ${getSizeClasses()}
          flex items-center justify-center
          bg-gray-400 text-white rounded-full
          cursor-not-allowed
          flex-shrink-0
          ${className}
        `}
        title="이 환경에서는 음성 기능을 지원하지 않습니다"
      >
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleSpeech}
      disabled={!text}
      className={`
        ${getSizeClasses()}
        flex items-center justify-center
        bg-blue-600 hover:bg-blue-700 
        text-white rounded-full
        transition-colors duration-200
        disabled:bg-gray-400 disabled:cursor-not-allowed
        flex-shrink-0
        ${className}
      `}
      title={isPlaying ? "재생 중지" : "음성으로 듣기"}
    >
      {isPlaying ? (
        // 정지 아이콘 (II 모양)
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" clipRule="evenodd"/>
        </svg>
      ) : (
        // 재생 아이콘
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.82L4.29 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.29l4.093-3.82a1 1 0 011.09-.104zM12 6.5a1 1 0 011.414 0 5 5 0 010 7.071A1 1 0 0112 12.157a3 3 0 000-4.314A1 1 0 0112 6.5z" clipRule="evenodd" />
          <path d="M14.657 3.757a1 1 0 011.414 0A9 9 0 0118 10a9 9 0 01-1.929 5.243 1 1 0 01-1.414-1.414A7 7 0 0016 10a7 7 0 00-1.343-4.243 1 1 0 010-1.414z" />
        </svg>
      )}
    </button>
  )
} 