import { NextResponse } from 'next/server';
import { createLearningClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic'; // 동적 렌더링 강제

export async function GET(
  request: Request,
  { params }: { params: { unitId: string } }
) {
  console.log(`API Call Time for unit ${params.unitId}: ${Date.now()}`); // 타임스탬프 로그 추가
  const { unitId } = params;

  if (!unitId) {
    return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 });
  }

  const supabase = createLearningClient();

  try {
    const { data, error } = await supabase
      .from('koreantraining')
      .select('*')
      .eq('id', unitId)
      .single();

    if (error) {
      console.error(`Error fetching unit ${unitId} from Supabase:`, error); // Supabase 에러 상세 로깅
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: `Unit with id ${unitId} not found` }, { status: 404 });
      }
      // 기타 Supabase 오류는 좀 더 일반적인 메시지 또는 그대로 반환
      return NextResponse.json({ error: `Failed to fetch unit data: ${error.message}` }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: `Unit with id ${unitId} not found` }, { status: 404 });
    }

    // 단원 데이터 반환

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) { // catch 블록 타입 명시
    console.error(`Unexpected error in GET /api/koreantraining/unit/${unitId}:`, err); // 예외 전체 로깅
    return NextResponse.json({ error: `An unexpected error occurred: ${err.message}` }, { status: 500 });
  }
} 