'use client'

import { useState } from 'react'

interface TTSButtonProps {
  text: string
  language?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function TTSButton({ 
  text, 
  language = 'ko-KR', 
  className = '', 
  size = 'md' 
}: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const speak = () => {
    if (!text || isPlaying) return

    // Web Speech API 지원 확인
    if (!('speechSynthesis' in window)) {
      alert('죄송합니다. 이 브라우저는 음성 재생을 지원하지 않습니다.')
      return
    }

    // 이전 음성 중지
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // 한국어 설정
    utterance.lang = language
    utterance.rate = 0.8 // 조금 느리게
    utterance.pitch = 1
    utterance.volume = 1

    // 한국어 음성 찾기
    const voices = window.speechSynthesis.getVoices()
    const koreanVoice = voices.find(voice => 
      voice.lang.includes('ko') || voice.name.includes('Korean')
    )
    
    if (koreanVoice) {
      utterance.voice = koreanVoice
    }

    setIsPlaying(true)

    utterance.onend = () => {
      setIsPlaying(false)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      console.error('음성 재생 중 오류가 발생했습니다.')
    }

    window.speechSynthesis.speak(utterance)
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 text-xs'
      case 'lg':
        return 'w-10 h-10 text-lg'
      default:
        return 'w-8 h-8 text-sm'
    }
  }

  return (
    <button
      onClick={speak}
      disabled={isPlaying || !text}
      className={`
        ${getSizeClasses()}
        flex items-center justify-center
        bg-korean-500 hover:bg-korean-600 
        text-white rounded-full
        transition-colors duration-200
        disabled:bg-gray-400 disabled:cursor-not-allowed
        ${className}
      `}
      title="음성으로 듣기"
    >
      {isPlaying ? (
        <svg className="animate-spin" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.82L4.29 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.29l4.093-3.82a1 1 0 011.09-.104zM12 6.5a1 1 0 011.414 0 5 5 0 010 7.071A1 1 0 0112 12.157a3 3 0 000-4.314A1 1 0 0112 6.5z" clipRule="evenodd" />
          <path d="M14.657 3.757a1 1 0 011.414 0A9 9 0 0118 10a9 9 0 01-1.929 5.243 1 1 0 01-1.414-1.414A7 7 0 0016 10a7 7 0 00-1.343-4.243 1 1 0 010-1.414z" />
        </svg>
      )}
    </button>
  )
} 