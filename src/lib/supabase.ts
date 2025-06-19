import { createClient } from '@supabase/supabase-js'
import { supabase as clientAuthSupabase } from './supabaseClient'; // supabaseClient.ts에서 가져옴

// 인증용 Supabase 클라이언트 (클라이언트 사이드) - 중앙 클라이언트 사용
export const authSupabase = clientAuthSupabase;

// 학습 데이터용 Supabase URL 및 Anon Key 환경 변수 확인
const learningSupabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const learningSupabaseAnonKey = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY;

if (!learningSupabaseUrl || !learningSupabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_LEARNING_SUPABASE_URL or NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY environment variables. Please check your .env.local file.');
}

// 학습 데이터용 Supabase 클라이언트 (클라이언트 사이드)
export const learningSupabase = createClient(
  learningSupabaseUrl,
  learningSupabaseAnonKey
);

// 서버 사이드 전용 클라이언트 생성 함수 - 인증용
const authAdminSupabaseUrl = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL; // ENV_SETUP.md 기준
const authAdminServiceRoleKey = process.env.AUTH_SUPABASE_SERVICE_ROLE_KEY;

if (typeof window === 'undefined' && (!authAdminSupabaseUrl || !authAdminServiceRoleKey)) {
    throw new Error('Missing NEXT_PUBLIC_AUTH_SUPABASE_URL or AUTH_SUPABASE_SERVICE_ROLE_KEY for admin client. Please check .env.local');
}

export function createAuthSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('createAuthSupabaseAdmin은 서버 사이드에서만 사용할 수 있습니다.')
  }
  if (!authAdminSupabaseUrl || !authAdminServiceRoleKey) { // 함수 호출 시점에도 한번 더 체크
    throw new Error('Auth admin Supabase URL/Key is not configured. Check .env.local');
  }
  return createClient(
    authAdminSupabaseUrl,
    authAdminServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// 서버 사이드 전용 클라이언트 생성 함수 - 학습 데이터용
const learningAdminSupabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const learningAdminServiceRoleKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

if (typeof window === 'undefined' && (!learningAdminSupabaseUrl || !learningAdminServiceRoleKey)) {
    throw new Error('Missing NEXT_PUBLIC_LEARNING_SUPABASE_URL or LEARNING_SUPABASE_SERVICE_ROLE_KEY for admin client. Please check .env.local');
}

export function createLearningSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('createLearningSupabaseAdmin은 서버 사이드에서만 사용할 수 있습니다.')
  }
  if (!learningAdminSupabaseUrl || !learningAdminServiceRoleKey) { // 함수 호출 시점에도 한번 더 체크
    throw new Error('Learning admin Supabase URL/Key is not configured. Check .env.local');
  }
  return createClient(
    learningAdminSupabaseUrl,
    learningAdminServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// 호환성을 위한 레거시 export (서버 사이드에서만 사용)
// 이제 create 함수를 직접 호출하는 것을 권장합니다.
export const authSupabaseAdmin = typeof window === 'undefined' 
  ? createAuthSupabaseAdmin() 
  : null;

export const learningSupabaseAdmin = typeof window === 'undefined' 
  ? createLearningSupabaseAdmin() 
  : null; 