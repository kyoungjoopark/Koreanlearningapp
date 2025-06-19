import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_AUTH_SUPABASE_URL or NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY environment variables. Please check your .env.local file.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

// 답변 추가/업데이트 (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { answer, teacherName } = await request.json()
    const questionId = params.id

    if (!answer || !teacherName) {
      return NextResponse.json(
        { error: '답변과 선생님 이름이 필요합니다.' },
        { status: 400 }
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