import Link from 'next/link'
import IdiomsClientPage from './IdiomsClientPage'
import { createLearningClient } from '@/utils/supabase/server'

// --- 레벨별 관용구 데이터 가져오기 ---
async function getIdiomsByLevel(level: string) {
    console.log(`[IDIOM_FETCH_DEBUG] 1. 함수 시작: 레벨 "${level}"에 대한 데이터를 가져옵니다.`);
    const supabase = createLearningClient();
    
    let query = supabase
        .from('idioms')
        .select('id, expression, meaning, meaning_en, example_sentence, example_sentence_en, explanation, situation, level')
        .eq('type', 'idiom');

    if (level !== 'all') {
        query = query.eq('level', level);
    }

    console.log('[IDIOM_FETCH_DEBUG] 2. Supabase 쿼리를 실행합니다.');
    const { data, error } = await query.order('id', { ascending: true });

    if (error) {
        console.error('[IDIOM_FETCH_ERROR] 3. Supabase 쿼리 에러 발생:', error);
        return [];
    }

    console.log(`[IDIOM_FETCH_SUCCESS] 3. Supabase 쿼리 성공. 가져온 데이터 ${data.length}개.`);
    // console.log('[IDIOM_FETCH_DATA]', data); // 데이터가 너무 많을 수 있으므로 일단 주석 처리

    return data;
}

export default async function IdiomsByLevelPage({ params }: { params: { level: string } }) {
  const level = decodeURIComponent(params.level);
  const idioms = await getIdiomsByLevel(level);

  if (!idioms || idioms.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
         <Link href="/learn/idioms" className="text-korean-600 hover:text-korean-800 mb-10 inline-block">
            &larr; 레벨 선택으로 돌아가기
          </Link>
        <h1 className="text-2xl font-bold">레벨 {level} 관용구</h1>
        <p className="mt-4">이 레벨에 해당하는 관용구가 없습니다.</p>
      </div>
    );
  }

  return <IdiomsClientPage idioms={idioms} level={level} />;
} 