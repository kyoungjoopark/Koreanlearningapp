import { createLearningClient } from '@/utils/supabase/server'
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
  initial: string | null;
}

interface Proverb {
  id: number;
  Proverb: string | null;
  Meaning: string | null;
  meaning_en: string | null;
  example_sentence: string | null;
  example_sentence_en: string | null;
  explanation_en: string | null;
  initial: string | null;
}

// --- 레벨별 관용구 데이터 가져오기 ---
async function getIdiomsByLevel(level: string): Promise<Idiom[]> {
    const supabase = createLearningClient();
    
    let query = supabase
        .from('idioms')
        .select('id, expression, meaning, meaning_en, example_sentence, example_sentence_en, explanation, situation, level')
        .eq('level', level);

    const { data, error } = await query.order('id', { ascending: true });

    if (error) {
        console.error('Error fetching idioms:', error);
        return [];
    }
    
    // `initial` 필드를 추가하여 Idiom 타입과 맞춥니다.
    return data ? data.map(item => ({ ...item, initial: null })) : [];
}

async function getProverbsByInitial(initial: string): Promise<Proverb[]> {
    const supabase = createLearningClient();
    
    let query = supabase
        .from('Proverbs')
        .select('id, Proverb, Meaning, initial, meaning_en, example_sentence, example_sentence_en, explanation_en');

    if (initial !== '전체') {
        console.log(`[getProverbsByInitial] Filtering with LIKE: '${initial}'`);
        query = query.like('initial', initial);
    }

    const { data, error } = await query.order('id', { ascending: true });

    if (error) {
        console.error('Error fetching proverbs:', error);
        return [];
    }
    
    console.log(`[getProverbsByInitial] Found ${data?.length || 0} proverbs.`);
    return data || [];
}

export default async function ExpressionLearningPage({ params }: { params: { type: string, level: string } }) {
  const { type, level } = params;
  const decodedLevel = decodeURIComponent(level);
  
  console.log(`[ExpressionLearningPage] Page render for type: ${type}, level: ${decodedLevel}`);

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
  if (type === 'proverbs') {
    const proverbs = await getProverbsByInitial(decodedLevel);

    if (!proverbs || proverbs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <p>'{decodedLevel}'(으)로 시작하는 속담을 찾을 수 없습니다.</p>
        </div>
      );
    }

    // Proverbs 데이터를 Idiom 형식으로 변환
    const mappedData: Idiom[] = proverbs.map(p => ({
      id: p.id,
      expression: p.Proverb,
      meaning: p.Meaning,
      meaning_en: p.meaning_en,
      example_sentence: p.example_sentence,
      example_sentence_en: p.example_sentence_en,
      explanation: p.explanation_en,
      situation: null,
      level: p.initial, // 레벨 대신 자음 정보 전달
      initial: p.initial,
    }));

    return <IdiomsClientPage idioms={mappedData} level={`속담 ${decodedLevel}`} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p>'{type}' 타입은 현재 지원하지 않습니다.</p>
    </div>
  );
} 