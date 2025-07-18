import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 환경 변수 체크 함수
function checkEnvironmentVariables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
  const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;
  
  // 환경변수 상태 확인
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[API] Missing environment variables:', { 
      supabaseUrl: !!supabaseUrl, 
      supabaseServiceKey: !!supabaseServiceKey 
    });
    return null;
  }
  
  return { supabaseUrl, supabaseServiceKey };
}

export async function GET(request: Request) {
  try {
    console.log('[API] GET /api/expression-progress - Request received');
    
    // 환경 변수 체크
    const envVars = checkEnvironmentVariables();
    if (!envVars) {
      return NextResponse.json({ 
        error: 'Missing Supabase environment variables for learning database'
      }, { status: 500 });
    }
    
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const level = searchParams.get('level');

    console.log('[API] GET params:', { contentType, level });

    if (!contentType || !level) {
      console.log('[API] Missing required parameters');
      return NextResponse.json(
        { error: 'contentType and level are required' },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[API] Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API] User authenticated:', user.id);

    // 학습 DB에서 진행 상황 조회
    const { createClient } = await import('@supabase/supabase-js');
    const learningSupabase = createClient(envVars.supabaseUrl, envVars.supabaseServiceKey);

    console.log('[API] Querying learning database...');
    const { data, error } = await learningSupabase
      .from('expression_learning_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('level', level)
      .single();

    console.log('[API] Database query result:', { data, error });

    if (error && error.code !== 'PGRST116') {
      console.error('[API] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    // 데이터가 없으면 기본값 반환
    if (!data) {
      console.log('[API] No progress data found, returning defaults');
      return NextResponse.json({
        currentIndex: 0,
        totalItems: 0,
        completedItems: [],
        isLevelCompleted: false
      });
    }

    console.log('[API] Progress data found, returning:', data);
    return NextResponse.json({
      currentIndex: data.current_index,
      totalItems: data.total_items,
      completedItems: data.completed_items || [],
      isLevelCompleted: data.is_level_completed
    });

  } catch (error) {
    console.error('[API] Error in GET /api/expression-progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('[API] POST /api/expression-progress - Request received');
    
    // 환경 변수 체크
    const envVars = checkEnvironmentVariables();
    if (!envVars) {
      return NextResponse.json({ 
        error: 'Missing Supabase environment variables for learning database'
      }, { status: 500 });
    }
    
    const body = await request.json();
    const { contentType, level, currentIndex, totalItems, completedItems, isLevelCompleted } = body;

    console.log('[API] POST data:', { contentType, level, currentIndex, totalItems, completedItems, isLevelCompleted });

    if (!contentType || !level) {
      console.log('[API] POST missing required parameters');
      return NextResponse.json(
        { error: 'contentType and level are required' },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[API] POST authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API] POST user authenticated:', user.id);

    // 학습 DB에서 진행 상황 업데이트
    const { createClient } = await import('@supabase/supabase-js');
    const learningSupabase = createClient(envVars.supabaseUrl, envVars.supabaseServiceKey);

    const updateData = {
      user_id: user.id,
      content_type: contentType,
      level: level,
      current_index: currentIndex,
      total_items: totalItems,
      completed_items: completedItems || [],
      is_level_completed: isLevelCompleted || false,
      last_accessed: new Date().toISOString()
    };

    console.log('[API] Upserting data:', updateData);

    const { data, error } = await learningSupabase
      .from('expression_learning_progress')
      .upsert(updateData, { 
        onConflict: 'user_id,content_type,level',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    console.log('[API] Upsert result:', { data, error });

    if (error) {
      console.error('[API] Database upsert error:', error);
      return NextResponse.json({ 
        error: 'Failed to update progress', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('[API] Progress saved successfully');
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('[API] Error in POST /api/expression-progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 