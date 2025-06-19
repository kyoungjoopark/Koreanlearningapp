import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAuthClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createAuthClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자/교사인지 확인하는 로직 (예: profiles 테이블 조회)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. 교사임이 확인되면, 서비스 키를 사용하여 모든 사용자 정보를 가져옴
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL!,
      process.env.AUTH_SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, nickname, fullname, nationality, status, created_at, starting_level, current_level, role')

    if (usersError) {
      throw usersError
    }

    // auth.users에서 이메일 정보를 가져와서 합치기
    const { data: authUsersData, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers()
    if (authUsersError) throw authUsersError

    const emailMap = new Map(authUsersData.users.map(u => [u.id, u.email]))
    
    const combinedUsers = users.map(u => ({
      ...u,
      email: emailMap.get(u.id) || null
    }))

    return NextResponse.json({ users: combinedUsers })

  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 