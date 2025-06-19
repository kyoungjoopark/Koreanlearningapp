import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, fullname, nationality, nickname } = await request.json()

  // 항상 환경 변수를 사용하여 Admin 클라이언트를 생성합니다.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY!
  )

  // 1. 이 이메일로 가입된 사용자가 auth.users에 이미 있는지 확인합니다.
  // listUsers는 이메일 필터를 직접 지원하지 않으므로, 먼저 모든 사용자를 가져와서 필터링하거나
  // 또는 이메일로 직접 사용자를 가져오는 다른 메서드를 사용해야 합니다.
  // 하지만 현재 Supabase JS 라이브러리의 admin 클라이언트는 이메일로 직접 사용자를 찾는
  // 공개된 메서드를 제공하지 않는 것으로 보이며, listUsers 후 필터링은 비효율적입니다.
  //
  // 대안으로, profiles 테이블에서 이메일을 검색하여 사용자의 존재와 상태를 한 번에 확인할 수 있습니다.
  // 이 방법이 훨씬 효율적입니다.

  // 1. profiles 테이블에서 이메일로 사용자 정보(id, status)를 조회합니다.
  const { data: existingProfile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, status')
    .eq('email', email)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 'No rows found'
    console.error('Error checking user existence:', profileError);
    return NextResponse.json({ error: '사용자 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }

  // 2. 만약 프로필이 존재한다면,
  if (existingProfile) {
    // 그 상태가 '비활성'이라면 재가입을 막습니다.
    if (existingProfile.status === 'inactive') {
      return NextResponse.json({ error: '비활성화된 계정으로, 재가입할 수 없습니다. 관리자에게 문의하세요.' }, { status: 409 }); // 409 Conflict
    } else {
      // 그 외의 경우 (예: 활성 사용자)는 이미 가입된 것으로 간주합니다.
      return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 });
    }
  }

  // 3. 존재하지 않는 이메일이면, 새로운 사용자를 생성합니다.
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // 이메일 인증을 사용하도록 설정 (보안 강화)
    user_metadata: { fullname, nationality, nickname },
  });

  if (createError) {
    console.error('Error creating user:', createError);
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // 저희가 만든 DB 트리거가 자동으로 profiles 테이블에 레코드를 생성하고,
  // status를 'inactive'로 설정할 것입니다.
  return NextResponse.json({ 
    message: '회원가입 신청이 완료되었습니다. 관리자의 승인 후 로그인이 가능합니다.', 
    user: newUser.user 
  });
} 