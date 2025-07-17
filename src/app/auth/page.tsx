'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import AuthClient from '@/components/AuthClient'

function AuthPageContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, [supabase]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          router.refresh();
          setUser(session?.user ?? null);
        }
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  if (loading) {
    return <div>Loading...</div>; // 로딩 중 UI
  }

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>이미 로그인되어 있습니다.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
          로그아웃
        </button>
      </div>
    );
  }

  return <AuthClient />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
} 