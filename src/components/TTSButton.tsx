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

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        // 음성 목록이 로드되면 더 이상 onvoiceschanged 이벤트를 수신할 필요가 없을 수 있습니다.
        // 하지만 동적으로 음성이 추가/제거되는 경우를 대비해 유지할 수 있습니다.
      }
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      // 컴포넌트 언마운트 시 재생 중인 음성 중지
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (!text || voices.length === 0) {
        // 음성 목록이 아직 로드되지 않았을 수 있습니다.
        // 사용자에게 잠시 후 다시 시도하라는 피드백을 줄 수 있습니다.
        console.warn("Voices not loaded yet or text is empty.");
        return;
      }

      if (!('speechSynthesis' in window)) {
        alert('죄송합니다. 사용하시는 브라우저가 음성 합성을 지원하지 않습니다.');
        return;
      }

      window.speechSynthesis.cancel();

      const cleanedText = text.replace(/(\*\*|\*|\[.*?\])/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      const isEnglish = ENGLISH_REGEX.test(cleanedText);
      const targetLang = isEnglish ? 'en-US' : 'ko-KR';

      utterance.lang = targetLang;
      utterance.rate = isEnglish ? 0.85 : 0.9; // 영어는 약간 더 느리게
      utterance.pitch = 1;
      utterance.volume = 1;

      const targetVoice = voices.find(voice => voice.lang === targetLang);
      
      if (targetVoice) {
        utterance.voice = targetVoice;
      } else {
        console.warn(`${targetLang} 음성을 찾을 수 없습니다. 기본 음성으로 재생됩니다.`);
      }

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = (event) => {
        if (event.error !== 'canceled') {
          console.error('음성 재생 중 오류가 발생했습니다.');
        }
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-5 h-5 text-xs' // 24px -> 20px로 크기 조정
      case 'lg':
        return 'w-10 h-10 text-lg'
      default:
        return 'w-8 h-8 text-sm'
    }
  }

  return (
    <button
      onClick={handleToggleSpeech}
      disabled={!text || voices.length === 0} // 텍스트가 없거나, 음성 로딩이 완료되지 않으면 비활성화
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
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" clipRule="evenodd"/></svg>
      ) : (
        // 재생 아이콘
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.82L4.29 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.29l4.093-3.82a1 1 0 011.09-.104zM12 6.5a1 1 0 011.414 0 5 5 0 010 7.071A1 1 0 0112 12.157a3 3 0 000-4.314A1 1 0 0112 6.5z" clipRule="evenodd" />
          <path d="M14.657 3.757a1 1 0 011.414 0A9 9 0 0118 10a9 9 0 01-1.929 5.243 1 1 0 01-1.414-1.414A7 7 0 0016 10a7 7 0 00-1.343-4.243 1 1 0 010-1.414z" />
        </svg>
      )}
    </button>
  )
} 