'use client';

import { useState } from 'react';

interface GeneratedData {
  id: number;
  expression: string;
  meaning: string;
  example_korean: string;
  example_english: string;
  situation?: string;
  level: string;
}

interface ResultData {
  id: number;
  expression: string;
  meaning: string;
  meaning_en: string;
  example_sentence: string;
  example_sentence_en: string;
  situation?: string;
  level: string;
  explanation: string;
}

export default function ManageIdiomsPage() {
  const [expression, setExpression] = useState('');
  const [meaning, setMeaning] = useState('');
  const [situation, setSituation] = useState('');
  const [level, setLevel] = useState('중급');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate-idiom-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, meaning, situation, level }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">관용구 예문 생성 및 관리</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="expression" className="block text-lg font-medium text-gray-700 mb-1">
              관용구 (Expression)
            </label>
            <input
              id="expression"
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="예: 발이 넓다"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="meaning" className="block text-lg font-medium text-gray-700 mb-1">
              의미 (Meaning)
            </label>
            <textarea
              id="meaning"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="예: 아는 사람이 많고 활동 범위가 넓다"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="situation" className="block text-lg font-medium text-gray-700 mb-1">
              상황 (Situation) <span className="text-sm text-gray-500">(선택 사항)</span>
            </label>
            <input
              id="situation"
              type="text"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="예: 친구가 파티에서 모든 사람과 인사할 때"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="level" className="block text-lg font-medium text-gray-700 mb-1">
              레벨 (Level)
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="초급">초급</option>
              <option value="중급">중급</option>
              <option value="고급">고급</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? '생성 중...' : '예문 생성 및 저장'}
          </button>
        </form>
      </div>

      {error && (
        <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          <strong>오류:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-2xl font-bold text-green-800 mb-4">성공적으로 처리되었습니다!</h2>
          <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm">
            <p><strong>관용구:</strong> {result.expression}</p>
            <p><strong>의미:</strong> {result.meaning}</p>
            <p><strong>영어 의미:</strong> {result.meaning_en}</p>
            <p><strong>레벨:</strong> {result.level}</p>
            <p><strong>상황:</strong> {result.situation || '입력 안함'}</p>
            
            <div className="border-t pt-4 mt-4">
              <p className="font-bold text-lg mb-2">예문</p>
              <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded">
                <p className="font-semibold">한국어 예문:</p>
                <p>{result.example_sentence}</p>
                <p className="font-semibold mt-2">영어 예문:</p>
                <p>{result.example_sentence_en}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="font-bold text-lg mb-2">상세 설명</p>
              <p className="bg-gray-50 p-3 rounded">{result.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 