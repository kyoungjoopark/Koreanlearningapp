# 🔧 환경변수 설정 가이드

## 📋 필요한 환경변수

### 1. `.env.local` 파일 생성
프로젝트 루트 디렉토리(`korean-learning-app`) 내에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# =============================================================================
# 한국어 학습 앱 환경변수 설정
# =============================================================================

# =============================================================================
# Supabase 설정 (필수)
# =============================================================================

# 인증용 Supabase (회원가입, 로그인, 사용자 정보, 질문/답변 저장 등)
NEXT_PUBLIC_AUTH_SUPABASE_URL=your_auth_supabase_url
NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY=your_auth_anon_key

# 학습데이터용 Supabase (AI 학습 데이터, 임베딩 등) 
NEXT_PUBLIC_LEARNING_SUPABASE_URL=your_learning_supabase_url
NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY=your_learning_anon_key

# 서버사이드 API용 Service Role 키 (선택사항 - 관리자 기능, 보안 강화 API 호출 등)
# 주의: 이 키들은 절대로 클라이언트에 노출되어서는 안 됩니다. 서버 측 로직에서만 사용하세요.
AUTH_SUPABASE_SERVICE_ROLE_KEY=your_auth_service_role_key
LEARNING_SUPABASE_SERVICE_ROLE_KEY=your_learning_service_role_key

# =============================================================================
# AI 설정 (AI 챗봇 기능을 위해 필수)
# =============================================================================

# OpenAI API 키
OPENAI_API_KEY=your_openai_api_key
```

## 🔑 환경변수 획득 방법

### Supabase 설정
1. [Supabase](https://supabase.com)에 로그인합니다.
2. 해당 프로젝트를 선택한 후, 왼쪽 사이드바에서 **Project Settings** (톱니바퀴 아이콘) > **API**로 이동합니다.
3. **Project URL**을 복사하여 해당하는 `_SUPABASE_URL` 변수 값으로 사용합니다.
4. **Project API keys** 섹션에서 `anon` `public` 키를 복사하여 해당하는 `_SUPABASE_ANON_KEY` 변수 값으로 사용합니다.
5. (선택사항) 동일 섹션의 `service_role` `secret` 키는 서버 측 로직(Node.js 환경의 API 라우트 등)에서만 사용해야 합니다. 절대로 클라이언트(브라우저) 코드에 노출되지 않도록 각별히 주의해야 합니다.

### OpenAI API 키
1. [OpenAI Platform API Keys 페이지](https://platform.openai.com/api-keys)에 로그인합니다.
2. "+ Create new secret key" 버튼을 클릭합니다.
3. 키에 대한 이름을 지정하고 "Create secret key"를 클릭합니다.
4. 생성된 API 키를 즉시 복사하여 `OPENAI_API_KEY` 값으로 저장합니다. **이 키는 다시 볼 수 없으므로 안전한 곳에 보관하세요.**

## 🚀 설정 완료 후

`.env.local` 파일에 환경변수를 올바르게 설정한 후, Next.js 개발 서버를 재시작해야 변경사항이 적용됩니다:
```bash
# 현재 실행 중인 서버가 있다면 Ctrl + C 로 종료 후 다시 실행
npm run dev
```

## ⚠️ 주의사항

- `.env.local` 파일은 Git 버전 관리에서 제외되어야 합니다. (프로젝트 생성 시 `.gitignore`에 `*.local` 규칙이 포함되어 있는지 확인하세요.)
- 모든 API 키 (Supabase Anon Key, Service Role Key, OpenAI API Key 등)는 민감한 정보이므로 안전하게 관리해야 합니다. 절대로 공개적인 저장소(GitHub 등)에 커밋하거나, 클라이언트 측 코드에 직접 하드코딩하지 마세요.
- 환경변수 값을 변경한 후에는 반드시 개발 서버를 재시작해야 합니다. Next.js는 빌드 시점에 환경변수를 읽어오므로, 실행 중인 서버에는 변경사항이 자동으로 반영되지 않습니다.

## 🔧 사용되지 않는 패키지들 (참고)

다음 패키지들은 현재 프로젝트의 주요 기술 스택 변경 또는 기능 구현 방향에 따라 사용 빈도가 낮거나 다른 것으로 대체되었습니다. 필요에 따라 `package.json`에서 정리할 수 있습니다:
- `next-auth`: 현재 Supabase의 내장 인증 기능을 직접 활용하고 있으므로, `next-auth` 라이브러리는 필수가 아닐 수 있습니다.
- `@ai-sdk/anthropic`: 현재 AI 모델로 OpenAI의 GPT 시리즈를 주로 사용하고 있으므로, Anthropic Claude 관련 SDK는 사용하지 않을 수 있습니다. 