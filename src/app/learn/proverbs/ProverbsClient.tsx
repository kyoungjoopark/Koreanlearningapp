'use client';

import { useState, useMemo } from 'react';
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
              <h3 className="text-xl font-semibold text-korean-800 mb-2">{proverb.proverb}</h3>
              <p className="text-korean-600 mb-2">{proverb.meaning}</p>
              <p className="text-gray-500 text-sm italic mb-4">{proverb.meaning_en}</p>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-semibold text-korean-700 mb-2">예문:</h4>
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