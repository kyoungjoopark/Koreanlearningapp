import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // 빌드 시점에는 더미 클라이언트를 반환
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      return createBrowserClient('https://dummy.supabase.co', 'dummy-key');
    } else {
      // 런타임에 브라우저에서 실행될 때 명확한 에러 표시
      if (typeof window !== 'undefined') {
        console.error('❌ Supabase environment variables are missing!');
        console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Render dashboard.');
        alert('Configuration Error: Please contact the administrator. Missing Supabase environment variables.');
      }
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
    }
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
} 