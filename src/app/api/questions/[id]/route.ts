import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 인증 및 사용자 정보용 클라이언트 (SSR)
const createSupaClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // 서버 컴포넌트에서 set 호출 시 발생 가능
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // 서버 컴포넌트에서 remove 호출 시 발생 가능
          }
        },
      },
    }
  );
};

// 답변 추가/업데이트 (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createSupaClient(cookieStore);

  try {
    const { answer, teacherName } = await request.json()
    const questionId = params.id

    console.log('Updating question with ID:', questionId)
    console.log('Answer:', answer)
    console.log('Teacher name:', teacherName)

    if (!answer || !teacherName) {
      return NextResponse.json(
        { error: '답변과 선생님 이름이 필요합니다.' },
        { status: 400 }
      )
    }

    // 먼저 질문이 존재하는지 확인
    const { data: existingQuestion, error: checkError } = await supabase
      .from('questions')
      .select('id, status')
      .eq('id', questionId)
      .single()

    console.log('Existing question:', existingQuestion)
    console.log('Check error:', checkError)

    if (checkError || !existingQuestion) {
      return NextResponse.json(
        { error: `질문 ID ${questionId}를 찾을 수 없습니다.` },
        { status: 404 }
      )
    }

    // 질문에 답변 추가 및 상태 업데이트
    const { data, error } = await supabase
      .from('questions')
      .update({
        answer,
        teacher_name: teacherName,
        status: 'answered',
        answered_at: new Date().toISOString()
      })
      .eq('id', questionId)
      .select()

    if (error) {
      console.error('답변 저장 오류:', error)
      return NextResponse.json(
        { error: '답변 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '해당 질문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '답변이 성공적으로 저장되었습니다.',
      question: data[0]
    })

  } catch (error) {
    console.error('답변 저장 오류:', error)
    return NextResponse.json(
      { error: '답변 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 질문 삭제 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createSupaClient(cookieStore);

  try {
    const questionId = params.id

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('질문 삭제 오류:', error)
      return NextResponse.json(
        { error: '질문 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '질문이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('질문 삭제 오류:', error)
    return NextResponse.json(
      { error: '질문 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 