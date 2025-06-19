import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화 (환경 변수 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY; // Admin Key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Key is missing from environment variables for grammar explanations API.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database client is not initialized.' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const {
      grammarItem,
      exampleSentence, // 문법 설명(grammar) 타입에만 주로 사용
      explanation,
      unitId,
      grammarType, // 문법 설명(grammar)의 세부 타입 (예: 'grammar', 'additional_grammar')
      explanationType = 'grammar', // 'grammar' 또는 'sentence', 기본값 'grammar'
      language = 'ko' // 언어 코드, 기본값 'ko'
    } = body;

    if (!grammarItem || !explanation || typeof explanation.trim() === 'undefined' || explanation.trim() === '') {
      return NextResponse.json({ error: 'grammarItem과 비어있지 않은 explanation은 필수 항목입니다.' }, { status: 400 });
    }
    if (explanationType === 'grammar' && !exampleSentence) {
      // 문법 타입인데 예문이 없는 경우 경고 또는 오류 처리 (현재는 경고만)
      console.warn('Warning: exampleSentence is missing for grammar type explanation.');
    }
    if (typeof grammarItem !== 'string' || typeof explanation !== 'string') {
        return NextResponse.json({ error: 'grammarItem, explanation은 문자열이어야 합니다.' }, { status: 400 });
    }
    if (unitId !== undefined && unitId !== null && typeof unitId !== 'number') {
        return NextResponse.json({ error: 'unitId가 제공된 경우 숫자여야 하지만, null이 아닌 다른 타입이거나 숫자가 아닙니다.' }, { status: 400 });
    }
    if (grammarType !== undefined && grammarType !== null && typeof grammarType !== 'string') {
        return NextResponse.json({ error: 'grammarType이 제공되고 null이 아닌 경우 문자열이어야 합니다.' }, { status: 400 });
    }

    console.log('Saving new explanation to DB:', { grammarItem, explanationType, language, unitId, grammarType });

    const { data, error } = await supabase
      .from('grammar_explanations')
      .insert([
        {
          grammar_item: grammarItem,
          example_sentence: explanationType === 'grammar' ? exampleSentence : null,
          explanation: explanation,
          unit_id: unitId, // 선택적 필드
          grammar_type: explanationType === 'grammar' ? grammarType : null, // grammar 타입일 때만 의미 있음
          explanation_type: explanationType,
          language: language,
          // is_approved는 기본값 false로 설정됨 (테이블 정의에 따라)
          // generated_by_ai는 기본값 true로 설정됨 (테이블 정의에 따라)
        },
      ])
      .select(); // 삽입된 데이터 반환

    if (error) {
      console.error('Error saving explanation to DB:', error);
      // PostgreSQL 에러 코드 '23505'는 unique_violation을 의미합니다.
      // (grammar_item, language, explanation_type) 조합에 대한 유니크 제약이 DB에 설정되어 있어야 함
      if (error.code === '23505') { 
        return NextResponse.json({ error: '이미 존재하는 항목입니다 (동일한 grammar_item, language, explanation_type).' , details: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: '데이터베이스 저장 중 오류가 발생했습니다.', details: error.message }, { status: 500 });
    }

    console.log('Successfully saved explanation to DB:', data);
    return NextResponse.json({ message: '설명이 성공적으로 저장되었습니다.', data: data?.[0] }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST grammar-explanations API:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database client is not initialized.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { grammar_item } = body;

    if (!grammar_item) {
      return NextResponse.json({ error: 'grammar_item이 필요합니다.' }, { status: 400 });
    }

    console.log(`[PATCH /api/grammar-explanations] DB 업데이트 시도: grammar_item='${grammar_item}'`);

    const { data, error } = await supabase
      .from('grammar_explanations')
      .update({ 
        explanation: body.explanation,
        updated_at: new Date().toISOString(),
      })
      .eq('grammar_item', grammar_item)
      .select()
      .single();

    if (error) {
      console.error('문법 설명 업데이트 DB 오류:', error);
      if (error.code === 'PGRST204') { // No rows found
        return NextResponse.json({ error: `업데이트할 '${grammar_item}' 항목을 찾을 수 없습니다.` }, { status: 404 });
      }
      return NextResponse.json({ error: '데이터베이스 업데이트 중 오류 발생', details: error.message }, { status: 500 });
    }

    console.log("업데이트 성공:", data);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[PATCH /api/grammar-explanations] API 오류:', error);
    return NextResponse.json({ error: '내부 서버 오류', details: error.message }, { status: 500 });
  }
} 