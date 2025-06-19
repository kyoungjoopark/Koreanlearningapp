import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 이 API 라우트는 서버 환경에서 실행되므로, 서비스 키를 사용해야 합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL 또는 서비스 키가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: Request,
  { params }: { params: { grammarItem: string } } // 파라미터 이름을 grammarItem으로 변경
) {
  try {
    const grammarItem = decodeURIComponent(params.grammarItem); // 변수 이름도 통일
    
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'ko';

    console.log(`[GET /api/grammar-explanations] Received request for grammarItem: "${grammarItem}", lang: "${lang}"`);

    let query = supabase
      .from('grammar_explanations')
      .select('explanation')
      .eq('grammar_item', grammarItem) // 조회 조건도 grammarItem으로
      .eq('language', lang);

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error(`Supabase DB 조회 오류 for grammarItem "${grammarItem}":`, error);
      return NextResponse.json({ error: `데이터베이스 조회 오류: ${error.message}` }, { status: 500 });
    }

    if (!data) {
      console.log(`Supabase DB에서 grammarItem "${grammarItem}"에 해당하는 데이터를 찾을 수 없음.`);
      return NextResponse.json({ error: '설명을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    console.log(`Supabase DB에서 grammarItem "${grammarItem}"에 대한 데이터 조회 성공:`, data);
    return NextResponse.json(data);

  } catch (err: any) {
    console.error('[GET /api/grammar-explanations] 서버 내부 오류:', err);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.', details: err.message }, { status: 500 });
  }
} 