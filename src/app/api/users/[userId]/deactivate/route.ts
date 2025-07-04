import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const cookieStore = cookies()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key) => cookieStore.get(key)?.value || null,
          setItem: (key, value) => {},
          removeItem: (key) => {},
        },
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    }
  )

  // First, check if the currently logged-in user is an admin.
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  if (!adminUser || adminUser.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const userIdToDeactivate = params.userId

  // Use the admin client to perform deactivation tasks
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Sign out the user from all sessions in auth.users
  const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userIdToDeactivate)
  
  if (signOutError) {
    console.error('Error signing out user:', signOutError)
    // This is not a critical error, so we can just log it and continue.
  }

  // 2. Update the status in the public.profiles table
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ status: 'inactive' })
    .eq('id', userIdToDeactivate)

  if (profileError) {
    console.error('Error updating user in profiles:', profileError)
    return NextResponse.json({ error: '프로필 상태 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ message: '사용자가 성공적으로 비활성화되었습니다.' })
} 