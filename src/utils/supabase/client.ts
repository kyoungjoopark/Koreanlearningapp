import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // 빌드 시점에는 더미 클라이언트를 반환
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      return createBrowserClient('https://dummy.supabase.co', 'dummy-key');
    } else {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
    }
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
} 