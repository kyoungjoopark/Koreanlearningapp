import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 학습 데이터 DB에 접근하기 위한 관리자용 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('학습 DB를 위한 Supabase URL 또는 서비스 키가 없습니다.');
}
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 현재 사용자의 인증 정보를 가져오기 위한 클라이언트
const createAuthClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// GET: 사용자의 모든 학습 기록 가져오기
export async function GET() {
  const cookieStore = cookies();
  const supabaseAuth = createAuthClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. 사용자의 모든 학습 기록(lesson_id)을 가져옵니다.
    const { data: progressData, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', user.id);

    if (progressError) throw progressError;
    if (!progressData || progressData.length === 0) {
      return NextResponse.json([]);
    }

    const lessonIds = progressData.map(p => p.lesson_id);

    // 2. 해당 lesson_id에 맞는 단원 정보를 koreantraining 테이블에서 가져옵니다.
    const { data: lessonData, error: lessonError } = await supabaseAdmin
      .from('koreantraining')
      .select('id, 과목, 단계, 주제, 제목')
      .in('id', lessonIds);

    if (lessonError) throw lessonError;
    if (!lessonData) {
      return NextResponse.json([]);
    }

    // 3. 두 데이터를 합쳐서 프론트엔드로 보냅니다.
    const progressMap = new Map(progressData.map(p => [p.lesson_id, p.completed_at]));
    const combinedData = lessonData
      .filter(lesson => lesson)
      .map((lesson: any) => ({
        ...lesson,
        completed_at: progressMap.get(lesson.id)
      }))
      .sort((a, b) => {
        const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return dateB - dateA;
      });

    return NextResponse.json(combinedData);

  } catch (error: any) {
    console.error("Error fetching user progress:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: 새로운 학습 기록 추가하기
export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabaseAuth = createAuthClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lesson_id } = await request.json();

  if (!lesson_id) {
    return NextResponse.json({ error: 'lesson_id가 필요합니다.' }, { status: 400 });
  }

  try {
    // 중복 기록을 방지하기 위해 upsert 사용
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .upsert(
        { user_id: user.id, lesson_id: lesson_id },
        { onConflict: 'user_id, lesson_id' }
      )
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error("Error saving user progress:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 