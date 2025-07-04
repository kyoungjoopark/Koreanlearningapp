'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

// SpeechRecognition API 타입 정의
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechInputProps {
  onTranscript: (text: string) => void;
  isSubmitting: boolean;
}

const SpeechInput: React.FC<SpeechInputProps> = ({ onTranscript, isSubmitting }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          setIsSupported(true);
          recognitionRef.current = new SpeechRecognition();
          const recognition = recognitionRef.current;
          recognition.continuous = false;
          recognition.lang = 'ko-KR';
          recognition.interimResults = false;

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onTranscript(transcript);
            setIsListening(false);
          };

          recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
          };
          
          recognition.onend = () => {
            setIsListening(false);
          };
        } else {
          console.log("Speech Recognition API not supported");
          setIsSupported(false);
        }
      } catch (error) {
        console.error("Error initializing Speech Recognition:", error);
        setIsSupported(false);
      }
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
    };
  }, [onTranscript]);

  const handleMicClick = () => {
    if (!isSupported || !recognitionRef.current) {
      alert("음성 인식이 지원되지 않는 환경입니다.\nSpeech recognition is not supported in this environment.");
      return;
    }
    
    try {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
      setIsListening(prev => !prev);
    } catch (error) {
      console.error("Error controlling speech recognition:", error);
      alert("음성 인식을 시작할 수 없습니다.\nCannot start speech recognition.");
    }
  };

  // 지원되지 않는 환경에서는 버튼을 숨김
  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={handleMicClick}
        disabled={!recognitionRef.current || isSubmitting}
        className={`p-2 rounded-full transition-all duration-200 relative ${
          isListening
            ? 'bg-blue-600 text-white shadow-lg transform scale-105'
            : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
        } disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
        title={isListening ? 
          "녹음 중지 (Click to stop recording)" : 
          "음성으로 질문하기 (Click to speak your question)"
        }
      >
        {isListening ? (
          <>
            <Square className="w-3 h-3" fill="currentColor" />
            {/* 녹음 중 애니메이션 */}
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
          </>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
      
      {/* 툴팁 */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        {isListening ? (
          <div className="text-center">
            <div className="font-medium">🔴 녹음 중...</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="font-medium">🎤 음성으로 질문하기</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechInput; 