import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import IdiomsClientPage from '../../../idioms/[level]/IdiomsClientPage'

// 데이터 타입 정의는 IdiomsClientPage로 이동하거나 공유 타입으로 분리하는 것이 좋습니다.
// 여기서는 간단히 유지합니다.
interface Idiom {
  id: number;
  expression: string | null;
  meaning: string | null;
  meaning_en: string | null;
  example_sentence: string | null;
  example_sentence_en: string | null;
  explanation: string | null;
  situation: string | null;
  level: string | null;
}

// --- Supabase 클라이언트 생성 ---
const createClt = (cookieStore: ReturnType<typeof cookies>) => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { 
            get(name: string) { 
                return cookieStore.get(name)?.value 
            } 
        } 
    });
}

// --- 레벨별 관용구 데이터 가져오기 ---
async function getIdiomsByLevel(level: string): Promise<Idiom[]> {
    const cookieStore = cookies()
    const supabase = createClt(cookieStore)
    
    let query = supabase
        .from('idioms')
        .select('id, expression, meaning, meaning_en, example_sentence, example_sentence_en, explanation, situation, level')
        .eq('level', level);

    const { data, error } = await query.order('id', { ascending: true });

    if (error) {
        console.error('Error fetching idioms:', error);
        return [];
    }
    return data || [];
}

export default async function ExpressionLearningPage({ params }: { params: { type: string, level: string } }) {
  const { type, level } = params;
  const decodedLevel = decodeURIComponent(level);

  // 현재는 'idioms' 타입만 처리하는 것으로 보입니다.
  // 다른 타입을 지원하려면 조건부 로직이 필요합니다.
  if (type === 'idioms') {
    const idioms = await getIdiomsByLevel(decodedLevel);
    
    if (!idioms || idioms.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <p>'{decodedLevel}' 레벨에 해당하는 관용구를 찾을 수 없습니다.</p>
        </div>
      );
    }

    return <IdiomsClientPage idioms={idioms} level={decodedLevel} />;
  }

  // 'proverbs' 등 다른 타입에 대한 처리
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p>'{type}' 타입은 현재 지원하지 않습니다.</p>
    </div>
  );
} 