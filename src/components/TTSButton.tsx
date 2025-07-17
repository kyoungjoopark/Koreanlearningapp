'use client'

import { useState, useEffect, useRef } from 'react'

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
  const [userStopped, setUserStopped] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const audioContextRef = useRef<AudioContext | null>(null)

  // 모바일 디바이스 감지
  const isMobile = typeof window !== 'undefined' ? 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : false

  // iOS 감지
  const isIOS = typeof window !== 'undefined' ? 
    /iPad|iPhone|iPod/.test(navigator.userAgent) : false

  // Android 감지  
  const isAndroid = typeof window !== 'undefined' ? 
    /Android/i.test(navigator.userAgent) : false

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initializeTTS = async () => {
      try {
        // 1. 기본 API 지원 확인
        const hasAPI = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
        
        // 2. 보안 컨텍스트 확인
        const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
        
        // 3. 디버그 정보 수집
        const info = [
          `Device: ${isMobile ? 'Mobile' : 'Desktop'}`,
          `Platform: ${isIOS ? 'iOS' : isAndroid ? 'Android' : 'Other'}`,
          `Protocol: ${location.protocol}`,
          `Secure: ${isSecureContext}`,
          `API: ${hasAPI}`,
          `UserAgent: ${navigator.userAgent.substring(0, 50)}...`
        ].join(' | ')
        
        setDebugInfo(info)
        console.log('[TTS] Debug Info:', info)

        if (!hasAPI) {
          console.error('[TTS] Speech Synthesis API not available')
          setIsSupported(false)
          return
        }

        if (!isSecureContext && isMobile) {
          console.warn('[TTS] Insecure context on mobile - TTS may not work')
        }

        // 4. 오디오 컨텍스트 초기화 (모바일 호환성)
        try {
          if (!audioContextRef.current) {
            // @ts-ignore - webkit prefix for Safari
            const AudioContext = window.AudioContext || window.webkitAudioContext
            if (AudioContext) {
              audioContextRef.current = new AudioContext()
              console.log('[TTS] AudioContext state:', audioContextRef.current.state)
            }
          }
        } catch (error) {
          console.warn('[TTS] AudioContext initialization failed:', error)
        }

        setIsSupported(true)
        
        // 5. Voices 로딩 (모바일에서 지연 로딩)
        const loadVoices = () => {
          const availableVoices = window.speechSynthesis.getVoices()
          console.log(`[TTS] Voices loaded: ${availableVoices.length}`)
          
          if (availableVoices.length > 0) {
            setVoices(availableVoices)
            
            // 디바이스별 추천 voice 로깅
            const koVoices = availableVoices.filter(v => v.lang.startsWith('ko'))
            const enVoices = availableVoices.filter(v => v.lang.startsWith('en'))
            console.log(`[TTS] Korean voices: ${koVoices.length}, English voices: ${enVoices.length}`)
          }
        }

        // 즉시 로딩 시도
        loadVoices()
        
        // 이벤트 리스너로 재시도 (모바일에서 비동기 로딩)
        window.speechSynthesis.onvoiceschanged = loadVoices
        
        // 모바일에서 지연 로딩을 위한 재시도
        if (isMobile) {
          const retryTimes = [100, 500, 1000, 2000]
          retryTimes.forEach(delay => {
            setTimeout(() => {
              if (voices.length === 0) {
                loadVoices()
              }
            }, delay)
          })
        }

      } catch (error) {
        console.error('[TTS] Initialization error:', error)
        setIsSupported(false)
      }
    }

    initializeTTS()

    return () => {
      try {
        if (window.speechSynthesis?.speaking) {
          window.speechSynthesis.cancel()
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close()
        }
      } catch (error) {
        console.error('[TTS] Cleanup error:', error)
      }
    }
  }, [isMobile, isIOS, isAndroid])

  // 오디오 컨텍스트 활성화 (사용자 제스처 필요)
  const activateAudioContext = async () => {
    if (!audioContextRef.current) return

    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
        console.log('[TTS] AudioContext resumed')
      }
    } catch (error) {
      console.error('[TTS] AudioContext activation failed:', error)
    }
  }

  const cleanTextForTTS = (inputText: string): string => {
    let cleaned = inputText.replace(/(\*\*|\*|\[.*?\])/g, '')
    cleaned = cleaned.replace(/[()]/g, ' ')
    cleaned = cleaned.replace(/[,\/\-~]/g, ' ')
    // ### 마크다운 헤더 제거
    cleaned = cleaned.replace(/^#{1,6}\s*/gm, '')
    cleaned = cleaned.replace(/\s+/g, ' ')
    cleaned = cleaned.trim()
    
    console.log('[TTS] Text cleaned:', cleaned.substring(0, 50) + '...')
    return cleaned
  }

  // 텍스트를 한국어와 영어 부분으로 분리하고 각각 최적 음성으로 재생
  const speakTextWithOptimalVoices = async (text: string) => {
    const segments = []
    const words = text.split(/\s+/)
    let currentSegment = ''
    let currentLang = ''
    
    for (const word of words) {
      if (!word.trim()) continue
      
      // 단어가 영어인지 한국어인지 판단
      const isEnglish = /[a-zA-Z]/.test(word)
      const wordLang = isEnglish ? 'en-US' : 'ko-KR'
      
      if (currentLang === '' || currentLang === wordLang) {
        // 같은 언어이거나 첫 단어인 경우
        currentSegment += (currentSegment ? ' ' : '') + word
        currentLang = wordLang
      } else {
        // 언어가 바뀐 경우, 이전 세그먼트 저장하고 새 세그먼트 시작
        if (currentSegment.trim()) {
          segments.push({ text: currentSegment.trim(), lang: currentLang })
        }
        currentSegment = word
        currentLang = wordLang
      }
    }
    
    // 마지막 세그먼트 추가
    if (currentSegment.trim()) {
      segments.push({ text: currentSegment.trim(), lang: currentLang })
    }

    console.log('[TTS] Text segments:', segments)
    
    // 세그먼트들을 순차적으로 재생
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      await playSegment(segment, i === 0)
    }
  }

  // 개별 세그먼트 재생 함수
  const playSegment = (segment: {text: string, lang: string}, isFirst: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(segment.text)
      utterance.lang = segment.lang
      
      if (segment.lang === 'en-US') {
        // 영어 원어민 발음 최적화
        utterance.rate = 0.9
        utterance.pitch = 1.0
        utterance.volume = 1.0
        
                 // 미국식 표준 영어 음성 우선 선택 (개선된 버전)
         const findBestEnglishVoice = () => {
           // 1. 고품질 미국 영어 음성 우선 (Google, Microsoft, Apple 등)
           let bestVoice = voices.find(v => 
             v.lang === 'en-US' && v.localService === true &&
             (v.name.includes('Google') || 
              v.name.includes('Microsoft') || 
              v.name.includes('Apple') ||
              v.name.includes('Samantha') || // macOS 기본 영어 음성
              v.name.includes('Alex') ||     // macOS 남성 영어 음성
              v.name.includes('Natural') ||
              v.name.includes('Premium') ||
              v.name.includes('Enhanced'))
           );
           
           // 2. 일반 로컬 미국 영어 음성
           if (!bestVoice) {
             bestVoice = voices.find(v => v.lang === 'en-US' && v.localService === true);
           }
           
           // 3. 온라인 미국 영어 음성 (Google TTS 등)
           if (!bestVoice) {
             bestVoice = voices.find(v => 
               v.lang === 'en-US' && 
               (v.name.includes('Google') || v.name.includes('US'))
             );
           }
           
           // 4. 일반 미국 영어 음성
           if (!bestVoice) {
             bestVoice = voices.find(v => v.lang === 'en-US');
           }
           
           // 5. 다른 영어권 음성 (캐나다, 호주 등)
           if (!bestVoice) {
             bestVoice = voices.find(v => 
               (v.lang === 'en-CA' || v.lang === 'en-AU' || v.lang === 'en-GB') &&
               v.localService === true
             );
           }
           
           // 6. 마지막 대안: 모든 영어 음성
           if (!bestVoice) {
             bestVoice = voices.find(v => v.lang.startsWith('en'));
           }
           
           return bestVoice;
         };
         
         const nativeEnglishVoice = findBestEnglishVoice();
        
        if (nativeEnglishVoice) {
          utterance.voice = nativeEnglishVoice
          console.log('[TTS] English voice selected:', nativeEnglishVoice.name, nativeEnglishVoice.lang)
        }
        
      } else {
        // 한국어 음성 설정
        utterance.rate = 0.8
        utterance.pitch = 1.0
        utterance.volume = 1.0
        
        // 고품질 한국어 음성 우선 선택
        const findBestKoreanVoice = () => {
          // 1. 고품질 로컬 한국어 음성 우선 (Google, Microsoft, Apple 등)
          let bestVoice = voices.find(v => 
            v.lang === 'ko-KR' && v.localService === true &&
            (v.name.includes('Google') || 
             v.name.includes('Microsoft') || 
             v.name.includes('Apple') ||
             v.name.includes('Natural') ||
             v.name.includes('Premium') ||
             v.name.includes('Enhanced'))
          );
          
          // 2. 일반 로컬 한국어 음성
          if (!bestVoice) {
            bestVoice = voices.find(v => v.lang === 'ko-KR' && v.localService === true);
          }
          
          // 3. 온라인 한국어 음성
          if (!bestVoice) {
            bestVoice = voices.find(v => 
              v.lang === 'ko-KR' && 
              (v.name.includes('Google') || v.name.includes('Korean'))
            );
          }
          
          // 4. 일반 한국어 음성
          if (!bestVoice) {
            bestVoice = voices.find(v => v.lang === 'ko-KR');
          }
          
          // 5. 마지막 대안: 첫 번째 음성
          if (!bestVoice) {
            bestVoice = voices[0];
          }
          
          return bestVoice;
        };
        
        const koreanVoice = findBestKoreanVoice();
        
        if (koreanVoice) {
          utterance.voice = koreanVoice
          console.log('[TTS] Korean voice selected:', koreanVoice.name, koreanVoice.lang)
        }
      }
      
      utterance.onstart = () => {
        if (isFirst) {
          setIsPlaying(true)
          setUserStopped(false)
        }
        console.log(`[TTS] Playing: "${segment.text}" (${segment.lang})`)
      }
      
      utterance.onend = () => {
        console.log(`[TTS] Completed: "${segment.text}"`)
        resolve()
      }
      
      utterance.onerror = (event) => {
        console.error(`[TTS] Error playing "${segment.text}":`, event.error)
        reject(event.error)
      }
      
      window.speechSynthesis.speak(utterance)
    })
  }

  const handleToggleSpeech = async () => {
    console.log('[TTS] === TTS Button Clicked ===')
    console.log('[TTS] Device Info:', { isMobile, isIOS, isAndroid })
    console.log('[TTS] Support Status:', { isSupported, voicesCount: voices.length })
    
    if (!isSupported) {
      alert('이 브라우저에서는 음성 기능을 지원하지 않습니다.')
      return
    }

    if (isPlaying) {
      setUserStopped(true)
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      console.log('[TTS] Playback stopped by user')
      return
    }

    if (!text?.trim()) {
      console.warn('[TTS] No text to speak')
      return
    }

    try {
      // 1. 오디오 컨텍스트 활성화 (사용자 제스처 내에서)
      await activateAudioContext()

      // 2. 기존 재생 중지
      window.speechSynthesis.cancel()
      
      // 3. 짧은 지연 후 새로운 음성 시작 (모바일 호환성)
      await new Promise(resolve => setTimeout(resolve, 100))

      const cleanedText = cleanTextForTTS(text)
      if (!cleanedText) return

      // 4. Utterance 생성 및 설정
      if (isMobile) {
        // 모바일에서도 한글/영어 분리 재생 지원 (단순화된 버전)
        console.log('[TTS Mobile] Using segmented playback for better language support')
        
        try {
          await speakTextWithOptimalVoices(cleanedText)
          setIsPlaying(false)
          setUserStopped(false)
          console.log('[TTS] Mobile segmented playback completed')
        } catch (error) {
          console.error('[TTS] Mobile segmented playback error:', error)
          setIsPlaying(false)
          setUserStopped(false)
          
          // 모바일에서 세그먼트 재생 실패 시 단일 utterance로 대체
          console.log('[TTS Mobile] Falling back to single utterance')
          const fallbackUtterance = new SpeechSynthesisUtterance(cleanedText)
          fallbackUtterance.lang = 'ko-KR' // 기본값은 한국어
          fallbackUtterance.rate = 0.8
          fallbackUtterance.pitch = 1.0
          fallbackUtterance.volume = 1.0
          
          const koreanVoice = voices.find(v => v.lang === 'ko-KR') || voices[0]
          if (koreanVoice) {
            fallbackUtterance.voice = koreanVoice
          }
          
          fallbackUtterance.onstart = () => {
            setIsPlaying(true)
            setUserStopped(false)
          }
          
          fallbackUtterance.onend = () => {
            setIsPlaying(false)
            setUserStopped(false)
          }
          
          fallbackUtterance.onerror = () => {
            setIsPlaying(false)
            setUserStopped(false)
          }
          
          window.speechSynthesis.speak(fallbackUtterance)
        }
       
      } else {
        // 데스크톱에서는 고급 다국어 음성 기능 사용
        console.log('[TTS] Starting desktop multi-language speech synthesis...')
        try {
          await speakTextWithOptimalVoices(cleanedText)
          setIsPlaying(false)
          setUserStopped(false)
          console.log('[TTS] Desktop playback completed')
        } catch (error) {
          console.error('[TTS] Desktop playback error:', error)
          setIsPlaying(false)
          setUserStopped(false)
        }
      }

    } catch (error) {
      console.error('[TTS] Critical error:', error)
      setIsPlaying(false)
      setUserStopped(false)
      
      if (isMobile) {
        alert('음성 기능을 사용할 수 없습니다. 브라우저 설정을 확인해주세요.')
      }
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-5 h-5 text-xs'
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
        title={`음성 기능 미지원\n${debugInfo}`}
      >
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
      </button>
    )
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
        ${isMobile ? 'active:bg-blue-800' : ''}
      `}
      title={
        isPlaying 
          ? "재생 중지" 
          : `음성으로 듣기${isMobile ? '\n(모바일 최적화됨)' : ''}`
      }
    >
      {isPlaying ? (
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" clipRule="evenodd"/>
        </svg>
      ) : (
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.82L4.29 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.29l4.093-3.82a1 1 0 011.09-.104zM12 6.5a1 1 0 011.414 0 5 5 0 010 7.071A1 1 0 0112 12.157a3 3 0 000-4.314A1 1 0 0112 6.5z" clipRule="evenodd" />
          <path d="M14.657 3.757a1 1 0 011.414 0A9 9 0 0118 10a9 9 0 01-1.929 5.243 1 1 0 01-1.414-1.414A7 7 0 0016 10a7 7 0 00-1.343-4.243 1 1 0 010-1.414z" />
        </svg>
      )}
    </button>
  )
} 