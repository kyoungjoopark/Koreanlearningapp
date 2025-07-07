import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { createLearningClient } from '@/utils/supabase/server';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

const LEVEL_ORDER: { [key: string]: number } = {
  '초급': 1,
  '중급': 2,
  '고급': 3,
};

const LEVEL_DESCRIPTIONS: { [key: string]: string } = {
  '초급': '사용 빈도가 낮은 관용구',
  '중급': '사용 빈도가 보통인 관용구',
  '고급': '사용 빈도가 높은 관용구',
};

const LEVEL_CIRCLE_TEXT: { [key: string]: string } = {
  '초급': '하',
  '중급': '중',
  '고급': '상',
};

const LEVEL_TITLE_TEXT: { [key: string]: string } = {
  '초급': '빈도 낮음',
  '중급': '빈도 보통',
  '고급': '빈도 높음',
};

const LEVEL_IMAGES: { [key: string]: string } = {
  '초급': '/assets/low.png',
  '중급': '/assets/mid.png',
  '고급': '/assets/high.png',
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/expressions" className="flex items-center text-gray-600 hover:text-gray-900 font-medium">
              <ArrowLeft className="w-5 h-5 mr-2" />
              표현 유형 선택으로 돌아가기
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-xl sm:text-2xl font-bold text-korean-800">관용구 학습</h1>
            <p className="text-base sm:text-lg text-korean-600 mt-2">
              사용 빈도별로 관용구를 학습하세요.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <ul className="divide-y divide-gray-200 space-y-2">
                {levels.map((level, index) => (
                  <li key={level} className="first:pt-0 last:pb-0">
                    <Link href={`/learn/idioms/${level}`}>
                      <div className="flex items-center justify-between p-8 hover:bg-korean-50 transition-colors mx-4 my-3 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-24 h-24 flex items-center justify-center mr-10">
                            {LEVEL_IMAGES[level] ? (
                              <Image
                                src={LEVEL_IMAGES[level]}
                                alt={`${LEVEL_TITLE_TEXT[level]} 캐릭터`}
                                width={90}
                                height={90}
                                className="rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="bg-korean-100 text-korean-700 font-bold rounded-full w-18 h-18 flex items-center justify-center">
                                {LEVEL_CIRCLE_TEXT[level] || level}
                              </div>
                            )}
                          </div>
                          <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-korean-800 mb-1">{LEVEL_TITLE_TEXT[level] || '관용구 학습하기'}</h2>
                            <p className="text-base sm:text-lg text-korean-500">{LEVEL_DESCRIPTIONS[level] || '관용구 학습하기'}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-8 h-8 text-gray-400" />
                      </div>
                    </Link>
                  </li>
                ))}
                {levels.length === 0 && (
                     <li className="p-10 text-center text-korean-500">
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