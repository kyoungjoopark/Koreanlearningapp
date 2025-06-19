import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { unitId: string } }) {
  const { unitId } = params;
  const currentUnitId = parseInt(unitId, 10);

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client is not initialized.' }, { status: 500 });
  }

  if (isNaN(currentUnitId)) {
    return NextResponse.json({ error: 'Valid Unit ID is required.' }, { status: 400 });
  }

  try {
    // 1. 현재 단원의 '과목'과 '단계' 정보 가져오기
    const { data: currentUnit, error: currentUnitError } = await supabase
      .from('koreantraining')
      .select('과목, 단계')
      .eq('id', currentUnitId)
      .single();

    if (currentUnitError) {
      console.error('Error fetching current unit details:', currentUnitError);
      return NextResponse.json({ error: '현재 단원 정보를 가져오는 데 실패했습니다.' }, { status: 500 });
    }

    if (!currentUnit) {
      return NextResponse.json({ error: '단원을 찾을 수 없습니다.' }, { status: 404 });
    }

    const { 과목, 단계 } = currentUnit;

    // 2. 같은 '과목'과 '단계'에 속한 모든 단원 목록을 ID 순서로 가져오기
    const { data: siblingUnits, error: siblingUnitsError } = await supabase
      .from('koreantraining')
      .select('id, 주제')
      .eq('과목', 과목)
      .eq('단계', 단계)
      .order('id', { ascending: true });

    if (siblingUnitsError) {
      console.error('Error fetching sibling units:', siblingUnitsError);
      return NextResponse.json({ error: '같은 과목/단계의 단원 목록을 가져오는 데 실패했습니다.' }, { status: 500 });
    }

    if (!siblingUnits || siblingUnits.length === 0) {
      return NextResponse.json({ prevUnit: null, nextUnit: null });
    }

    // 3. 현재 단원의 인덱스 찾기
    const currentIndex = siblingUnits.findIndex((unit: { id: number }) => unit.id === currentUnitId);

    if (currentIndex === -1) {
      console.error(`[NAV_API_DEBUG] Current unit (id: ${currentUnitId}) not found in sibling list.`);
      return NextResponse.json({ error: '목록에서 현재 단원을 찾을 수 없습니다.' }, { status: 500 });
    }

    // 4. 이전 단원과 다음 단원 정보 설정
    const prevUnitData = currentIndex > 0 ? siblingUnits[currentIndex - 1] : null;
    const nextUnitData = currentIndex < siblingUnits.length - 1 ? siblingUnits[currentIndex + 1] : null;
    
    const prevUnit = prevUnitData ? { id: prevUnitData.id, title: prevUnitData.주제 } : null;
    const nextUnit = nextUnitData ? { id: nextUnitData.id, title: nextUnitData.주제 } : null;

    // 디버깅을 위한 최종 결과 로그
    console.log(`[NAV_API_DEBUG] Final Navigation Info for unitId: ${unitId}`, {
      prevUnit,
      nextUnit,
      currentIndex,
      totalSiblings: siblingUnits.length
    });

    return NextResponse.json({ prevUnit, nextUnit });

  } catch (error) {
    console.error('Error in unit navigation API:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
} 