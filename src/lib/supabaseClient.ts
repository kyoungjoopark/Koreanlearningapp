import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any

function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      // 빌드 시점에는 더미 클라이언트를 반환하고, 런타임에 에러 발생
      if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
        // 빌드 시점에는 더미 값으로 클라이언트 생성
        supabaseInstance = createClient(
          'https://dummy.supabase.co',
          'dummy-key'
        );
      } else {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables. Please check your .env.local file.');
      }
    } else {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return supabaseInstance
}

export const supabase = getSupabase()

export default supabase 