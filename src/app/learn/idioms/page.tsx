import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { createLearningClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const LEVEL_ORDER: { [key: string]: number } = {
  '초급': 1,
  '중급': 2,
  '고급': 3,
};

async function getLevels() {
  const supabase = createLearningClient();
  const { data, error } = await supabase
    .from('idioms')
    .select('level');

  if (error) {
    console.error('Error fetching idiom levels:', error);
    return [];
  }
  
  if (!data) {
    return [];
  }

  const levels = data
    .map(item => item.level)
    .filter((value, index, self) => self.indexOf(value) === index && value); // null or empty values filtered out
  
  return levels.sort((a, b) => {
    const levelA = LEVEL_ORDER[a] || 99;
    const levelB = LEVEL_ORDER[b] || 99;
    return levelA - levelB;
  });
}

export default async function IdiomLevelSelectPage() {
  const levels = await getLevels();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href="/expressions" className="flex items-center text-gray-600 hover:text-gray-900 font-medium">
              <ArrowLeft className="w-5 h-5 mr-2" />
              표현 유형 선택으로 돌아가기
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-korean-800">관용구 학습</h1>
            <p className="text-lg text-korean-600 mt-2">
              도전하고 싶은 레벨을 선택하여 학습을 시작하세요.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <ul className="divide-y divide-gray-200">
                {levels.map((level, index) => (
                  <li key={level}>
                    <Link href={`/learn/idioms/${level}`}>
                      <div className="flex items-center justify-between p-6 hover:bg-korean-50 transition-colors">
                        <div className="flex items-center">
                          <div className="bg-korean-100 text-korean-700 font-bold rounded-full w-12 h-12 flex items-center justify-center mr-6">
                            {level}
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-korean-800">레벨 {level}</h2>
                            <p className="text-sm text-korean-500">관용구 학습하기</p>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-400" />
                      </div>
                    </Link>
                  </li>
                ))}
                {levels.length === 0 && (
                     <li className="p-6 text-center text-korean-500">
                        학습할 수 있는 관용구 레벨이 없습니다.
                     </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 