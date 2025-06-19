import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // 모든 응답에 대해 캐시를 비활성화하여 항상 최신 상태를 반영하도록 합니다.
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // 세션 정보 및 우리가 만든 '세션 플래그' 쿠키를 가져옵니다.
  const { data: { session } } = await supabase.auth.getSession();
  const hasSessionFlag = request.cookies.has('session_flag');
  const { pathname, searchParams } = request.nextUrl;

  // 시나리오 1: 브라우저 재시작 감지 및 강제 로그아웃
  // Supabase 세션은 있지만, 브라우저가 닫히면 사라지는 session_flag 쿠키가 없을 경우
  // 브라우저가 재시작된 것으로 간주하고 강제로 로그아웃시킵니다.
  if (session && !hasSessionFlag && pathname !== '/auth') {
    // 로그아웃을 먼저 수행합니다.
    await supabase.auth.signOut();
    
    // 로그인 페이지로 리디렉션합니다.
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth';
    redirectUrl.searchParams.set('reason', 'session_expired');
    
    // signOut으로 인해 변경된 쿠키를 헤더에 담아 리디렉션 응답을 반환합니다.
    return NextResponse.redirect(redirectUrl, {
      headers: response.headers,
    });
  }

  // 시나리오 2: 비활성 사용자 확인 및 강제 로그아웃
  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', session.user.id)
      .single();

    if (profile && profile.status === 'inactive') {
      await supabase.auth.signOut();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth';
      redirectUrl.searchParams.set('error', 'inactive_account');
      return NextResponse.redirect(redirectUrl, {
        headers: response.headers,
      });
    }
  }

  // 시나리오 3: 비로그인 사용자의 보호된 페이지 접근 차단
  if (!session && pathname !== '/auth') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth';
    if (pathname !== '/') {
      redirectUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 시나리오 4: 로그인 사용자의 /auth 페이지 접근 시 리디렉션 (무한 루프 방지 로직 추가)
  if (session && pathname === '/auth') {
    // 'session_expired' 이유로 방금 막 리디렉션된 것이 아니라면, courses로 보냅니다.
    if (searchParams.get('reason') !== 'session_expired') {
      return NextResponse.redirect(new URL('/courses', request.url));
    }
  }
  
  // 모든 검사를 통과한 경우, 원래 요청을 그대로 진행시키되
  // Supabase 클라이언트에서 생성된 응답 헤더(인증 쿠키 업데이트 등)를 포함하여 반환합니다.
  // 이렇게 하면 /auth 페이지나 다른 모든 페이지가 정상적으로 렌더링됩니다.
  const nextResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  response.headers.forEach((value, key) => {
    nextResponse.headers.set(key, value);
  });

  return nextResponse;
}

export const config = {
  matcher: [
    /*
     * 아래와 일치하는 경로를 제외한 모든 요청 경로에서 미들웨어 실행:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘 파일)
     * - api/ (API 라우트) - API는 자체적으로 인증을 처리해야 함
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};