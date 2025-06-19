import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 학습 데이터용 Supabase 클라이언트 생성 (환경 변수 사용)
// 서버-서버 통신이므로 RLS를 우회하기 위해 서비스 키를 사용합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or Service Key for learning data');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('koreantraining') // 실제 테이블명으로 변경 필요할 수 있음
      .select('id, 과목, 단계, 주제, 제목'); // 실제 컬럼명 확인 필요

    if (error) {
      console.error('Error fetching units:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching units:', err);
    return NextResponse.json({ error: 'Unexpected error fetching units' }, { status: 500 });
  }
} 