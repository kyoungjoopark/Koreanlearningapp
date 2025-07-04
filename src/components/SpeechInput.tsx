'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

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
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
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
      }
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("음성 인식이 지원되지 않는 브라우저입니다.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(prev => !prev);
  };

  return (
    <button
      type="button"
      onClick={handleMicClick}
      disabled={!recognitionRef.current || isSubmitting}
      className={`p-2 rounded-full transition-colors ${
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
      } disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
      title={isListening ? "녹음 중지" : "음성으로 질문하기"}
    >
      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
};

export default SpeechInput; 