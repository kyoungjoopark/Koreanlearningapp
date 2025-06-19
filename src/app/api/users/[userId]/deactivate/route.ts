import { NextResponse } from 'next/server';
import { createAuthClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createAuthClient(cookieStore);

    // 1. 현재 사용자가 교사인지 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // 2. 대상 사용자의 상태를 'inactive'로 변경
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', params.userId);

    if (updateError) throw updateError;

    return NextResponse.json({ message: 'User deactivated successfully' });
  } catch (error: any) {
    console.error('Deactivate user error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
} 