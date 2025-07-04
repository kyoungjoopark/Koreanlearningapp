import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

const supabase = createClient()

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher'
}

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  level: string
  created_at: string
}

// 관리자 계정 이메일 목록
export const ADMIN_EMAILS = ['kpark71@hanmail.net']

// 이메일로 사용자 역할 확인
export function getUserRole(email: string): UserRole {
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return UserRole.TEACHER
  }
  return UserRole.STUDENT
}

// 선생님/관리자 권한 확인
export function isTeacher(user: User | string): boolean {
  const email = typeof user === 'string' ? user : user.email;
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// 관리자 권한 확인  
export function isAdmin(user: User | string): boolean {
  return isTeacher(user) // 현재는 선생님이 관리자 역할
}

// 사용자 권한 확인 함수들
export function canAccessTeacherDashboard(user: User): boolean {
  return isTeacher(user)
}

export function canAnswerQuestions(user: User): boolean {
  return isTeacher(user)
}

export function canManageStudents(user: User): boolean {
  return isTeacher(user)
}

export interface SignUpData {
  email: string
  password: string
  fullname: string
  nickname: string
  nationality: string
}

export interface SignInData {
  email: string
  password: string
}

// 회원가입 (이제 새로운 API 엔드포인트를 호출합니다)
export async function signUp(data: SignUpData) {
  const { email, password, fullname, nickname, nationality } = data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        fullname,
        name: fullname,
        nickname,
        nationality,
      },
    },
  });

  if (error) {
    throw error;
  }

  return { message: '회원가입 이메일을 확인해주세요.' };
}

// 로그인
export async function signIn(data: SignInData) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password
  })

  if (error) {
    throw error
  }

  if (authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', authData.user.id)
      .single();

    if (profile && profile.status === 'inactive') {
      await supabase.auth.signOut();
      throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.');
    }

    // [세션 플래그 쿠키 설정]
    // 로그인 성공 시, 브라우저가 닫히면 사라지는 세션 플래그 쿠키를 설정합니다.
    if (typeof document !== 'undefined') {
      document.cookie = "session_flag=true; path=/; SameSite=Lax";
    }
  }

  return authData
}

// 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }

  // [세션 플래그 쿠키 삭제]
  // 로그아웃 시, 세션 플래그 쿠키를 즉시 만료시켜 삭제합니다.
  if (typeof document !== 'undefined') {
    document.cookie = "session_flag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }
}

// 사용자 프로필 업데이트
export async function updateUserProfile(data: {
  fullname?: string
  nationality?: string
  nickname?: string
  level?: string
}) {
  const { data: result, error } = await supabase.auth.updateUser({
    data: data
  })

  if (error) {
    throw error
  }

  return result
}

// 현재 사용자 정보 가져오기
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw error
  }
  
  return user
}

// 사용자 프로필 정보 가져오기
export async function getUserProfile() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return {
    id: user.id,
    email: user.email,
    fullname: user.user_metadata?.fullname || 'Unknown',
    nickname: user.user_metadata?.nickname || user.user_metadata?.fullname?.split(' ')[0] || 'User',
    nationality: user.user_metadata?.nationality || 'Unknown',
    level: user.user_metadata?.level || 'beginner',
    role: getUserRole(user.email || ''),
    joined_at: user.created_at
  }
}

// 사용자 권한 확인
export async function checkUserRole(userId: string): Promise<UserRole> {
  try {
    const profile = await getUserProfile()
    return profile?.role || UserRole.STUDENT
  } catch (error) {
    console.error('Check user role error:', error)
    return UserRole.STUDENT
  }
}

// 인증 상태 변화 감지
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event: string, session: any) => {
      callback(session?.user || null)
    }
  )
  
  return () => subscription.unsubscribe()
} 