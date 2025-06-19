import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase credentials are not configured.' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  let level = searchParams.get('level');

  if (!type || !level) {
    return NextResponse.json({ error: 'Type and level are required' }, { status: 400 });
  }
  
  // URL에 포함된 레벨 값은 인코딩되어 있을 수 있으므로 디코딩합니다.
  level = decodeURIComponent(level);

  const getFirstConsonant = (str: string): string | null => {
    if (!str) return null;
    const charCode = str.charCodeAt(0);
    if (charCode < 0xAC00 || charCode > 0xD7A3) return null; // 한글 음절이 아닌 경우
  
    const consonantIndex = Math.floor((charCode - 0xAC00) / (21 * 28));
    const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    return consonants[consonantIndex];
  };

  try {
    if (type === 'idioms') {
      let query = supabase.from('idioms').select('id, expression, meaning, example_sentence');

      if (level !== 'all') {
        query = query.eq('level', level);
      }

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json(data);

    } else if (type === 'proverbs') {
      const { data, error } = await supabase
        .from('Proverbs')
        .select('id, Proverb, Meaning');

      if (error) {
        throw error;
      }

      let filteredData = data;
      // DB 쿼리 대신 JS에서 직접 필터링
      if (level && level !== '전체' && data) {
        filteredData = data.filter(item => getFirstConsonant(item.Proverb) === level);
      }

      // 프론트엔드가 기대하는 데이터 형식으로 변환
      const formattedData = filteredData.map(item => ({
        id: item.id,
        expression: item.Proverb,
        meaning: item.Meaning,
        example_sentence: ''
      }));

      return NextResponse.json(formattedData);
    } else {
      return NextResponse.json({ error: 'Invalid expression type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`Error fetching expressions for type: ${type}, level: ${level}`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data from the database.' }, { status: 500 });
  }
} 