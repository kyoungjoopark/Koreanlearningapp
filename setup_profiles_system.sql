-- profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  fullname VARCHAR(255),
  name VARCHAR(255),
  nickname VARCHAR(255),
  nationality VARCHAR(255),
  level VARCHAR(50) DEFAULT 'beginner',
  status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 정책 생성: 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "사용자는 자신의 프로필만 조회 가능" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 정책 생성: 사용자는 자신의 프로필만 업데이트 가능
CREATE POLICY "사용자는 자신의 프로필만 업데이트 가능" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 관리자는 모든 프로필 조회 가능
CREATE POLICY "관리자는 모든 프로필 조회 가능" ON public.profiles
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'kpark71@hanmail.net'
  );

-- 관리자는 모든 프로필 업데이트 가능
CREATE POLICY "관리자는 모든 프로필 업데이트 가능" ON public.profiles
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'kpark71@hanmail.net'
  );

-- 새 사용자 생성 시 profiles 테이블에 레코드 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    fullname, 
    name, 
    nickname, 
    nationality, 
    level, 
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'fullname', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'fullname', ''),
    COALESCE(NEW.raw_user_meta_data->>'nickname', ''),
    COALESCE(NEW.raw_user_meta_data->>'nationality', ''),
    COALESCE(NEW.raw_user_meta_data->>'level', 'beginner'),
    'inactive'  -- 새 사용자는 비활성 상태로 시작
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 이메일 인증 완료 시 활성화하는 함수
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 이메일이 인증되었고 이전에는 인증되지 않았던 경우
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles
    SET status = 'active', updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 생성 시 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 사용자 업데이트 시 트리거 (이메일 인증 완료 감지)
DROP TRIGGER IF EXISTS on_user_updated ON auth.users;
CREATE TRIGGER on_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC); 