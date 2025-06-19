import { createBrowserClient } from '@supabase/ssr'
 
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY!,
    {
        auth: {
            storage: typeof window !== 'undefined' ? sessionStorage : undefined,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
  ) 