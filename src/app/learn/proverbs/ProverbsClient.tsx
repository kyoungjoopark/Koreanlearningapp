'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Volume2, PauseCircle } from 'lucide-react';
import { Proverb } from './page';

const INITIALS = [
  'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
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
  
  // TTS 상태 관리
  const [ttsState, setTtsState] = useState({ id: null as string | null, isPlaying: false, isPaused: false });
  const [isTTSSupported, setIsTTSSupported] = useState(false);
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);

  useEffect(() => {
    // TTS 지원 여부 확인
    const checkTTSSupport = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
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
  }, []);

  // TTS 함수들
  const playNextInQueue = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[TTS] Speech synthesis not supported in this environment');
      setTtsState({ id: null, isPlaying: false, isPaused: false });
      return;
    }

    if (utteranceQueueRef.current.length > 0) {
      const utterance = utteranceQueueRef.current.shift();
      if (utterance) {
        if (!ttsState.id) {
          utteranceQueueRef.current = [];
          return;
        }
        utterance.onend = playNextInQueue;
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
      setTtsState({ id: null, isPlaying: false, isPaused: false });
    }
  };

  const handleTTS = (id: string, ...texts: string[]) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('죄송합니다. 현재 환경에서는 음성 합성 기능을 사용할 수 없습니다.');
      console.warn('[TTS] Speech synthesis not supported in this environment');
      return;
    }

    const { id: currentId, isPlaying } = ttsState;

    try {
      if (isPlaying && currentId === id) {
        window.speechSynthesis.pause();
        setTtsState({ id, isPlaying: false, isPaused: true });
      } else if (!isPlaying && currentId === id) { 
        window.speechSynthesis.resume();
        setTtsState({ id, isPlaying: true, isPaused: false });
      } else {
        window.speechSynthesis.cancel();
        utteranceQueueRef.current = [];

        const languages = ['ko-KR', 'en-US'];
        texts.forEach((text, index) => {
          if (!text) return;

          const lang = languages[index] || 'ko-KR';
          const chunks = text.match(/[^.!?]+[.!?]*/g) || [text];
          
          chunks.forEach(chunk => {
            if (chunk.trim()) {
              const utterance = new SpeechSynthesisUtterance(chunk);
              utterance.lang = lang;
              utterance.rate = lang === 'ko-KR' ? 1.1 : 1.0;
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
        {INITIALS.map(initial => (
          <button
            key={initial}
            onClick={() => setSelectedInitial(initial)}
            className={`w-12 h-12 text-lg rounded-full transition-colors ${
              selectedInitial === initial ? 'bg-korean-600 text-white' : 'bg-white text-korean-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {initial}
          </button>
        ))}
      </div>

      <div className="space-y-4 max-w-4xl mx-auto">
        {filteredProverbs.length > 0 ? (
          filteredProverbs.map(proverb => (
            <div key={proverb.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-korean-800">{proverb.proverb}</h3>
                <div className="flex items-center space-x-2">
                  {isTTSSupported && (
                    <button 
                      onClick={() => handleTTS(`proverb_title_${proverb.id}`, proverb.proverb)} 
                      className="text-korean-600 hover:text-korean-800 transition-colors"
                      title="속담 듣기"
                    >
                      {ttsState.isPlaying && ttsState.id === `proverb_title_${proverb.id}` ? <PauseCircle size={20} /> : <Volume2 size={20} />}
                    </button>
                  )}
                  {!isTTSSupported && (
                    <span className="text-gray-400" title="이 환경에서는 음성 기능을 지원하지 않습니다">
                      🔇
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-grow">
                  <p className="text-korean-600 mb-2">{proverb.meaning}</p>
                  <p className="text-gray-500 text-sm italic">{proverb.meaning_en}</p>
                </div>
                {isTTSSupported && (
                  <button 
                    onClick={() => handleTTS(`proverb_meaning_${proverb.id}`, proverb.meaning, proverb.meaning_en)} 
                    className="text-korean-600 hover:text-korean-800 transition-colors ml-4"
                    title="의미 듣기"
                  >
                    {ttsState.isPlaying && ttsState.id === `proverb_meaning_${proverb.id}` ? <PauseCircle size={18} /> : <Volume2 size={18} />}
                  </button>
                )}
                {!isTTSSupported && (
                  <span className="text-gray-400 ml-4" title="이 환경에서는 음성 기능을 지원하지 않습니다">
                    🔇
                  </span>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center mb-2">
                  <h4 className="font-semibold text-korean-700 mr-2">예문:</h4>
                  {isTTSSupported && (
                    <button 
                      onClick={() => handleTTS(`proverb_example_${proverb.id}`, proverb.example_sentence, proverb.example_sentence_en)} 
                      className="text-korean-600 hover:text-korean-800 transition-colors"
                      title="예문 듣기"
                    >
                      {ttsState.isPlaying && ttsState.id === `proverb_example_${proverb.id}` ? <PauseCircle size={18} /> : <Volume2 size={18} />}
                    </button>
                  )}
                  {!isTTSSupported && (
                    <span className="text-gray-400" title="이 환경에서는 음성 기능을 지원하지 않습니다">
                      🔇
                    </span>
                  )}
                </div>
                <p className="text-korean-600">{proverb.example_sentence}</p>
                <p className="text-gray-500 text-sm italic">{proverb.example_sentence_en}</p>
              </div>

              {proverb.explanation_en && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-semibold text-korean-700 mb-2">Detailed Explanation:</h4>
                  <p className="text-gray-700 whitespace-pre-line">{proverb.explanation_en}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-korean-500">
              {selectedInitial ? `'${selectedInitial}'(으)로 시작하는 속담이 없습니다.` : '등록된 속담이 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
} 