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

// 질문 제출 (POST) - 인증 DB 사용
export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createSupaClient(cookieStore);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: 사용자를 인증할 수 없습니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json({ error: '질문 내용이 필요합니다.' }, { status: 400 });
    }
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('name, nickname')
      .eq('id', user.id)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
    }
    
    const studentName = profileData?.name || profileData?.nickname || 'Unknown';

    const { data: questionData, error: insertError } = await supabase
      .from('questions')
      .insert({
        question: question.trim(),
        student_email: user.email,
        student_name: studentName,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: `질문 저장 중 DB 오류가 발생했습니다: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json(questionData, { status: 201 });

  } catch (error: any) {
    if (error.name === 'SyntaxError') {
      return NextResponse.json({ error: '잘못된 요청 형식입니다 (Invalid JSON).' }, { status: 400 });
    }
    return NextResponse.json({ error: `서버에서 예기치 않은 심각한 오류가 발생했습니다: ${error.message}` }, { status: 500 });
  }
}

// 질문 목록 조회 (GET) - 인증 DB 사용
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createSupaClient(cookieStore);

  try {
    const { searchParams } = new URL(request.url);
    const studentEmail = searchParams.get('student_email');
    const isTeacher = searchParams.get('isTeacher');

    // 교사용 질문 목록 조회
    if (isTeacher === 'true') {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized: 사용자를 인증할 수 없습니다.' }, { status: 401 });
      }

      // 사용자가 교사인지 확인
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || profileData?.role !== 'teacher') {
        return NextResponse.json({ error: 'Forbidden: 교사 권한이 필요합니다.' }, { status: 403 });
      }

      // 모든 답변 대기 질문 조회
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      return NextResponse.json(data);
    }

    // 학생용 질문 목록 조회
    if (!studentEmail) {
      return NextResponse.json({ error: 'student_email is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('student_email', studentEmail)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 