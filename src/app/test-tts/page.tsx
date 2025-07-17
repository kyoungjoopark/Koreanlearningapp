'use client'

import { useState, useEffect } from 'react'
import TTSButton from '@/components/TTSButton'

export default function TTSTestPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [testResults, setTestResults] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return

    const collectDebugInfo = () => {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        onLine: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        
        // 위치 정보
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        port: window.location.port,
        
        // 보안 컨텍스트
        isSecureContext: window.isSecureContext,
        
        // TTS API 지원
        hasSpeechSynthesis: 'speechSynthesis' in window,
        hasSpeechSynthesisUtterance: 'SpeechSynthesisUtterance' in window,
        
        // 오디오 지원
        hasAudioContext: 'AudioContext' in window,
        hasWebkitAudioContext: 'webkitAudioContext' in window,
        
        // 디바이스 타입
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isAndroid: /Android/i.test(navigator.userAgent),
        
        // 브라우저 감지
        isChrome: /Chrome/.test(navigator.userAgent),
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
        isFirefox: /Firefox/.test(navigator.userAgent),
        
        // 화면 정보
        screenWidth: screen.width,
        screenHeight: screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        
        // Voices 정보 (초기값)
        voicesCount: 0,
        koreanVoices: 0,
        englishVoices: 0,
        defaultVoice: 'None'
      }

      // Voices 정보 업데이트
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices()
        info.voicesCount = voices.length
        info.koreanVoices = voices.filter(v => v.lang.startsWith('ko')).length
        info.englishVoices = voices.filter(v => v.lang.startsWith('en')).length
        info.defaultVoice = voices.find(v => v.default)?.name || 'None'
      }

      setDebugInfo(info)
    }

    // 즉시 수집
    collectDebugInfo()

    // Voices 로딩 후 재수집
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = collectDebugInfo
      
      // 모바일에서 지연 로딩을 고려한 재시도
      setTimeout(collectDebugInfo, 1000)
      setTimeout(collectDebugInfo, 3000)
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const testCases = [
    { label: '한국어 짧은 텍스트', text: '안녕하세요' },
    { label: '한국어 긴 텍스트', text: '안녕하세요. 저는 한국어를 배우고 있습니다. 오늘 날씨가 정말 좋네요.' },
    { label: '영어 텍스트', text: 'Hello, how are you today?' },
    { label: '혼합 텍스트', text: '안녕하세요. Hello. 저는 김철수입니다. Nice to meet you.' },
    { label: '숫자 포함', text: '저는 25살이고, 서울에 살고 있습니다.' },
    { label: '특수문자 포함', text: '안녕하세요! 오늘은 2024년 1월 1일입니다. (새해 복 많이 받으세요)' },
  ]

  const runBasicTest = async () => {
    const results: Record<string, string> = {}
    
    try {
      // 1. API 지원 테스트
      if (!('speechSynthesis' in window)) {
        results.apiSupport = '❌ Speech Synthesis API 미지원'
        setTestResults(results)
        return
      }
      results.apiSupport = '✅ Speech Synthesis API 지원됨'

      // 2. Voices 로딩 테스트
      const voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) {
        results.voicesLoading = '⚠️ Voices 아직 로딩 중 (잠시 후 다시 시도)'
      } else {
        results.voicesLoading = `✅ ${voices.length}개 음성 로딩됨`
      }

      // 3. 한국어 음성 지원 테스트
      const koreanVoices = voices.filter(v => v.lang.startsWith('ko'))
      if (koreanVoices.length === 0) {
        results.koreanSupport = '❌ 한국어 음성 없음'
      } else {
        results.koreanSupport = `✅ ${koreanVoices.length}개 한국어 음성`
      }

      // 4. 보안 컨텍스트 테스트
      if (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
        results.secureContext = '✅ 보안 컨텍스트 OK'
      } else {
        results.secureContext = '❌ 보안 컨텍스트 문제 (HTTPS 필요)'
      }

      // 5. 실제 TTS 테스트
      results.actualTest = '🧪 실제 테스트 중...'
      setTestResults({ ...results })

      const testUtterance = new SpeechSynthesisUtterance('테스트')
      testUtterance.lang = 'ko-KR'
      
      const testPromise = new Promise<string>((resolve) => {
        let resolved = false
        
        testUtterance.onstart = () => {
          if (!resolved) {
            resolved = true
            resolve('✅ TTS 재생 성공')
          }
        }
        
        testUtterance.onerror = (event) => {
          if (!resolved) {
            resolved = true
            resolve(`❌ TTS 오류: ${event.error}`)
          }
        }
        
        // 3초 타임아웃
        setTimeout(() => {
          if (!resolved) {
            resolved = true
            resolve('⏰ TTS 타임아웃 (3초 내 시작 안됨)')
          }
        }, 3000)
      })

      window.speechSynthesis.speak(testUtterance)
      const testResult = await testPromise
      results.actualTest = testResult

    } catch (error) {
      results.error = `❌ 테스트 중 오류: ${error}`
    }

    setTestResults(results)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
            🔊 음성 기능 이용 안내
          </h1>

          {/* 디버그 정보 - 모바일에서는 숨김 */}
          <div className="mb-6 sm:mb-8 hidden sm:block">
            <h2 className="text-xl font-semibold mb-4">📊 시스템 정보</h2>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(debugInfo).map(([key, value]) => (
                    <tr key={key} className="border-b">
                      <td className="py-1 pr-4 font-medium text-gray-600">{key}:</td>
                      <td className="py-1 text-gray-800">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 기본 테스트 - 모바일에서는 숨김 */}
          <div className="mb-6 sm:mb-8 hidden sm:block">
            <h2 className="text-xl font-semibold mb-4">🧪 자동 진단 테스트</h2>
            <button
              onClick={runBasicTest}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mb-4"
            >
              진단 테스트 실행
            </button>
            
            {Object.keys(testResults).length > 0 && (
              <div className="bg-gray-100 p-4 rounded-lg">
                {Object.entries(testResults).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TTS 버튼 테스트 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">🎯 음성 재생 테스트</h2>
            <div className="space-y-3 sm:space-y-4">
              {testCases.map((testCase, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 p-3 sm:p-4 rounded-lg gap-3 sm:gap-0">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm sm:text-base">{testCase.label}</div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1 break-all">{testCase.text}</div>
                  </div>
                  <div className="flex justify-center sm:justify-end">
                    <TTSButton text={testCase.text} size="md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 문제 해결 가이드 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">🛠️ 문제 해결 가이드</h2>
            <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-sm sm:text-base">모바일에서 음성이 나오지 않는 경우:</h3>
              <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm">
                <li><strong>📱 iOS Safari:</strong> 설정 → 접근성 → 음성 콘텐츠 → 음성 활성화</li>
                <li><strong>🤖 Android:</strong> 설정 → 접근성 → 텍스트 음성 변환 → Google TTS 설치</li>
                <li><strong>🌐 Chrome:</strong> 최신 버전으로 업데이트</li>
                <li><strong>🔒 보안:</strong> HTTPS 연결 사용 (http://는 제한적)</li>
                <li><strong>🎧 권한:</strong> 브라우저 오디오 권한 허용</li>
                <li><strong>🔊 볼륨:</strong> 시스템 볼륨 및 미디어 볼륨 확인</li>
              </ul>
            </div>
          </div>

          {/* 링크 */}
          <div className="text-center">
            <a 
              href="/learn/61" 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-block"
            >
              학습 페이지로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 