import { createClient, SupabaseClient } from '@supabase/supabase-js'
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

// 캐시된 클라이언트 인스턴스
let learningAdminClient: SupabaseClient | null = null;
let authAdminClient: SupabaseClient | null = null;

/**
 * 학습 데이터베이스용 관리자 클라이언트
 * (service_role 키 사용)
 */
export function getLearningAdminSupabase(): SupabaseClient {
  if (learningAdminClient) {
    return learningAdminClient;
  }

  const learningAdminSupabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
  const learningAdminServiceRoleKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

  if (!learningAdminSupabaseUrl || !learningAdminServiceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_LEARNING_SUPABASE_URL or LEARNING_SUPABASE_SERVICE_ROLE_KEY for admin client. Please check .env.local');
  }

  learningAdminClient = createClient(learningAdminSupabaseUrl, learningAdminServiceRoleKey);
  return learningAdminClient;
}

/**
 * 인증용 관리자 클라이언트 생성 함수
 * (service_role 키 사용 - 서버 사이드 전용)
 */
export function createAuthSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('createAuthSupabaseAdmin은 서버 사이드에서만 사용할 수 있습니다.')
  }

  const authAdminSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const authAdminServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!authAdminSupabaseUrl || !authAdminServiceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client. Please check .env.local');
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

// 호환성을 위한 레거시 export (서버 사이드에서만 사용)
export const authSupabaseAdmin = typeof window === 'undefined' 
  ? createAuthSupabaseAdmin() 
  : null;

export const learningSupabaseAdmin = typeof window === 'undefined' 
  ? getLearningAdminSupabase() 
  : null; 