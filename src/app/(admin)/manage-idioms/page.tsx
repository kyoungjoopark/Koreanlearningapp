'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성 (클라이언트 컴포넌트용)
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // 빌드 시점에는 더미 클라이언트를 반환
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      return createClient('https://dummy.supabase.co', 'dummy-key');
    } else {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
    }
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

const supabase = createSupabaseClient();

interface InactiveUser {
  id: string;
  email: string | undefined;
  fullname: string;
  nickname: string;
  created_at: string;
}

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

export default function ManagePage() {
  // 사용자 관리 상태
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [activationStatus, setActivationStatus] = useState<{ [key: string]: string }>({});

  // 관용구 관리 상태
  const [expression, setExpression] = useState('');
  const [meaning, setMeaning] = useState('');
  const [situation, setSituation] = useState('');
  const [level, setLevel] = useState('중급');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  // 비활성 사용자 목록 가져오기
  const fetchInactiveUsers = async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, fullname, nickname, created_at, email')
        .eq('status', 'inactive')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedUsers = data.map((profile: any) => ({
          id: profile.id,
          email: profile.email || '이메일 정보 없음',
          fullname: profile.fullname,
          nickname: profile.nickname,
          created_at: new Date(profile.created_at).toLocaleString(),
      }));

      setInactiveUsers(formattedUsers);
    } catch (err: any) {
      setUserError('비활성 사용자 목록을 불러오는 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setUserLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInactiveUsers();
  }, []);
  
  // 사용자 활성화 처리
  const handleReactivateUser = async (userId: string) => {
    setActivationStatus(prev => ({ ...prev, [userId]: 'loading' }));
    try {
      const response = await fetch(`/api/users/${userId}/reactivate`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류');
      }
      
      setActivationStatus(prev => ({ ...prev, [userId]: 'success' }));
      // 성공 시 목록에서 해당 사용자를 제거
      setInactiveUsers(prevUsers => prevUsers.filter(user => user.id !== userId));

    } catch (err: any) {
      setActivationStatus(prev => ({ ...prev, [userId]: 'error' }));
      alert(`사용자 활성화 실패: ${err.message}`);
    }
  };

  // 관용구 예문 생성 핸들러
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
      {/* 사용자 관리 섹션 */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-6">사용자 관리</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">승인 대기중인 사용자</h2>
          {userLoading && <p>사용자 목록을 불러오는 중...</p>}
          {userError && <div className="text-red-500">{userError}</div>}
          {!userLoading && !userError && inactiveUsers.length === 0 && (
            <p className="text-gray-500">승인 대기중인 사용자가 없습니다.</p>
          )}
          {inactiveUsers.length > 0 && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름 (닉네임)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inactiveUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.created_at}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullname} ({user.nickname})</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleReactivateUser(user.id)}
                        disabled={activationStatus[user.id] === 'loading'}
                        className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-wait"
                      >
                        {activationStatus[user.id] === 'loading' ? '처리중...' : '활성화'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* 관용구 관리 섹션 */}
      <div>
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