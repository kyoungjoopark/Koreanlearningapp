# 한국어 학습 앱 프로젝트 진행사항 정리

## 📋 프로젝트 개요

### **목표**
AI 기반 개인 맞춤형 한국어 학습 플랫폼 구축
- 학습자용 기능: Q&A, 연습, 단어학습, 마이페이지
- 선생님용 관리자 기능: 질문 답변, 학습자 관리

### **기술 스택**
- **Frontend**: Next.js 14.2.29 + TypeScript + React 19 (Beta)
- **Styling**: Tailwind CSS + 커스텀 한국어 컬러 팔레트
- **Backend**: Supabase (인증용, 학습데이터용 - 2개 주요 인스턴스)
- **AI**: AI SDK + OpenAI API 연동
- **폰트**: Noto Sans KR (Google Fonts)

---

## 🎯 완성된 기능들

### **✅ 1. 프로젝트 기본 설정**
- **패키지 구성**: package.json, next.config.js, tailwind.config.js, tsconfig.json
- **환경변수**: `.env.local` 및 `ENV_SETUP.md` 가이드에 따라 설정 (인증용/학습용 Supabase 키, OpenAI 키)
- **라이브러리**: 
  - `src/lib/supabaseClient.ts` - 클라이언트 컴포넌트용 Supabase 클라이언트 (중앙 관리) ⭐ **NEW**
  - `src/lib/supabase.ts` - 서버 컴포넌트 및 API 라우트용 Supabase 클라이언트 (필요시 `supabaseClient`와 구분 사용)
  - `src/lib/ai.ts` - AI SDK 설정, 벡터 검색, 챗봇 응답 생성
  - `src/lib/auth.ts` - 역할 기반 인증 시스템 (현재는 이메일 기반 관리자 확인)
- **타입 정의**: `src/types/supabase.ts` (필요시 업데이트)

### **✅ 2. UI/UX 시스템**
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **한국어 최적화**: Noto Sans KR 폰트, 한국어 컬러 팔레트
- **컴포넌트 스타일**: 
  - `.btn-primary`, `.btn-secondary` (버튼)
  - `.card` (카드 레이아웃)
  - `.input-field` (입력 필드)
  - 커스텀 한국어 색상 클래스들
- **앱 제목 변경**: "KJ의 한국어 트레이닝" → "KJ의 한국어 배우기" (적용됨)
- **헤더 사용자 표시**: 이메일 대신 닉네임 표시 (닉네임 없을 시 이메일) ⭐ **NEW**

### **✅ 3. 페이지 구조 (6개 페이지)**

#### **3.1 홈페이지** (`/`)
- 5개 메인 기능 + 1개 관리자 기능 카드
- 전체 앱 네비게이션 허브
- **5분 자동 로그아웃 기능**: 사용자 비활성 시간 감지 및 자동 로그아웃 (모달 확인 후 로그아웃)
- **활동 추적**: 마우스, 키보드, 스크롤 등 사용자 활동 모니터링 (자동 로그아웃용)
- **안정적인 세션 처리 및 리다이렉션 로직** ⭐ **IMPROVED**

#### **3.2 로그인/회원가입** (`/auth`)
- 이메일/패스워드 인증 폼 (`Auth.tsx` 컴포넌트 활용)
- 로그인↔회원가입 토글 기능
- 입력 검증 및 상태 관리
- **이메일 인증 없는 회원가입**: 바로 계정 생성 및 로그인 가능
- **개선된 사용자 피드백**: 성공 메시지 및 자동 리다이렉트
- **안정적인 세션 확인 및 리다이렉션 로직** (`/auth`와 `/` 간의 올바른 이동) ⭐ **IMPROVED**

#### **3.3 마이 페이지** (`/my-page`)
- **사용자 정보**: 이름, 이메일, 레벨, 가입일 (표시 예정)
- **학습 통계**: 학습 일수, 완료한 연습, 학습한 단어, 평균 점수 (표시 예정)
- **선생님께 질문**: 빠른 질문 입력 폼 (API 연동 완료)
- **최근 학습 로그**: 활동 기록 (구현 예정)
- **Q&A 기록**: 질문 히스토리 (구현 예정)

#### **3.4 한국어 Q&A** (`/korean-qa`)
- **챗봇 인터페이스**: 메시지 전송/수신
- **실시간 대화**: 타임스탬프 포함
- **최근 대화 목록**: 사이드바에 5개 대화 표시 (구현 예정)
- **AI 응답**: OpenAI API 연동 완료 (API 키 필요)
- **대화 창 크기 확장**: 화면 높이의 65%로 조정
- **대화 로그 저장**: 텍스트 파일로 대화 내용 다운로드 (구현 예정)
- **대화 기록 삭제**: 확인 대화상자와 함께 대화 초기화 (구현 예정)
- **개선된 에러 처리**: 상세한 오류 메시지 및 로깅

#### **3.5 한국어 연습** (`/practice`)
- **4단계 레벨**: 초급/초중급/중급/고급 (콘텐츠 구성 예정)
- **4가지 연습 유형**: 듣기/말하기/대화완성/번역 (콘텐츠 구성 예정)
- **연습 기록**: 점수 및 진도 추적 (구현 예정)
- **연습 설명**: 각 유형별 가이드 (구현 예정)

#### **3.6 단어 학습** (`/vocabulary`)
- **레벨별 단어 카드**: 플래시카드 형식 (콘텐츠 구성 예정, `roadmap.csv` 연동 예정)
- **단어 정보**: 한국어, 의미, 발음, 예문 (콘텐츠 구성 예정)
- **학습 기록**: 레벨별 학습 통계 (구현 예정)
- **학습 팁**: 효과적인 학습 방법 안내 (구현 예정)

### **✅ 4. 선생님 관리자 시스템** ⭐ **ENHANCED**

#### **4.1 권한 기반 접근 제어**
- **관리자 이메일**: `kpark71@hanmail.net` (환경 변수 `NEXT_PUBLIC_ADMIN_EMAIL`로 설정 가능)
- **역할 시스템**: 현재 이메일 주소로 관리자 여부 판단 (향후 Supabase 역할 기반으로 확장 가능)
- **접근 권한 검증**: 선생님만 대시보드 접근 가능
- **실제 인증 상태 확인**: 세션 기반 권한 검사 강화

#### **4.2 선생님 대시보드** (`/teacher-dashboard`)
- **오늘의 통계**: 새 질문, 답변 완료, 활동 학습자, 평균 응답 시간 (표시 예정)
- **질문 관리**: 
  - 우선순위별 분류 (긴급/일반/나중에) (구현 예정)
  - 카테고리별 분류 (문법/발음/학습방법) (구현 예정)
  - 실시간 질문 선택 및 답변 작성 (API 연동 완료)
- **답변 인터페이스**: 질문 선택 → 답변 작성 → 상태 업데이트 (API 연동 완료)
- **답변 완료 기록**: 히스토리 관리 (구현 예정)
- **상세한 오류 처리**: 로딩 상태 및 접근 권한 오류 메시지

### **✅ 5. 인증 및 보안 시스템** ⭐ **IMPROVED**

#### **5.1 자동 로그아웃 시스템**
- **5분 타이머**: 사용자 비활성 시간 5분 초과 시 자동 로그아웃 알림 모달 표시
- **활동 감지**: 마우스 이동, 클릭, 키보드 입력, 스크롤 감지 (현재 `page.tsx`에서 구현)
- **타이머 리셋**: 사용자 활동 시 자동으로 타이머 초기화
- **자동 리다이렉트**: 모달 확인 시 로그아웃 후 로그인 페이지(`/auth`)로 자동 이동

#### **5.2 세션 관리**
- **Supabase 인증 연동**: `onAuthStateChange`를 통한 실시간 인증 상태 감지 및 UI 업데이트
- **로그아웃 리다이렉트**: 수동/자동 로그아웃 시 일관되게 `/auth` 페이지로 이동
- **인증 상태 추적**: `page.tsx` 중심으로 인증 상태 관리 및 조건부 렌더링/리다이렉션
- **Supabase 클라이언트 일원화**: `src/lib/supabaseClient.ts`를 통해 클라이언트 측 Supabase 인스턴스 관리 ⭐ **NEW**

### **✅ 6. AI 챗봇 시스템** ⭐ **IMPROVED**

#### **6.1 채팅 인터페이스**
- **커스텀 메시지 처리**: AI SDK의 `useChat` 대신 직접 `fetch`를 사용하여 API 호출 (`src/app/api/chat/route.ts`)
- **안정성 향상**: 에러 처리 및 재시도 로직 (부분적, 지속 개선 필요)
- **기본 응답 제공**: OpenAI API 키 없을 때 또는 오류 발생 시 안내 메시지 (현재 `src/lib/ai.ts`에서 오류 시 기본 메시지 반환)

#### **6.2 대화 관리**
- **대화 로그 저장**: (구현 예정)
- **대화 기록 삭제**: (구현 예정)
- **UI 개선**: 로그 저장/삭제 버튼 추가, 대화 창 크기 조정

---

## 🗄️ 데이터베이스 현황

### **기존 Supabase 데이터 (학습데이터용)**
- **dic 테이블**: 2,122개 PDF 청크 (Korean dic.pdf 608페이지 분할)
- **embeddings 테이블**: 벡터 임베딩 데이터

### **roadmap.csv 연계 분석 (`ROADMAP_INTEGRATION.md` 참고)**
**✅ 연계 가능성**: 매우 높음 (세부 계획 문서 참조)
- **구조**: 교재명, 레벨, 단원명, 주제, 목표, 문법, 표현 등
- **활용 방안**:
  1. 단어 학습에서 레벨별/주제별 단어 제공
  2. 문법과 연계된 예문 생성 (AI 활용 가능성)
  3. 단계적 학습 진행 시스템
  4. 커리큘럼 기반 학습 가이드

---

## 🔧 해결된 주요 기술적 문제들 ⭐ **RECENTLY RESOLVED**

### **1. 환경 변수 로드 및 Supabase 클라이언트 초기화 오류**
- **문제**: `Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY` 오류 반복 발생.
- **원인**: `.env.local` 파일 누락, 환경 변수명 불일치, Next.js 환경 변수 참조 방식 오해, Supabase 클라이언트 중복/부정확한 초기화.
- **해결**:
  - `ENV_SETUP.md` 가이드에 따라 정확한 변수명으로 `.env.local` 파일 생성 및 값 입력 확인.
  - `src/lib/supabaseClient.ts` 파일 생성하여 클라이언트 컴포넌트용 Supabase 인스턴스 중앙 관리.
  - `src/app/page.tsx` 등 주요 컴포넌트에서 `supabaseClient`를 import하여 사용, 일관성 확보.
  - 환경 변수 변경 후 서버 재시작 철저.

### **2. 로그인 및 세션 처리, 리다이렉션 루프**
- **문제**: 로그인 후 메인 페이지로 이동하지 않고 다시 로그인 페이지로 돌아오거나, 페이지가 깜빡이는 현상 (무한 루프), 자동 로그아웃 로직 오작동.
- **원인**: `page.tsx`와 `auth/page.tsx` 간의 세션 상태에 따른 리다이렉션 로직 충돌, `useEffect` 의존성 배열 문제, Supabase `onAuthStateChange` 핸들링 미흡.
- **해결**:
  - `page.tsx`의 `useEffect` 로직을 초기 세션 로드, 인증 상태 변경 리스너, 활동 감지 리스너 등으로 명확히 분리하고 최적화.
  - `isLoading` 상태를 도입하여 세션 확인 전까지 로딩 UI 표시.
  - `useRouter` 및 `usePathname`을 활용한 조건부 리다이렉션 로직 강화.
  - `supabase.auth.onAuthStateChange` 리스너에서 세션 상태를 안정적으로 업데이트하고, 불필요한 리다이렉션 방지.
  - 자동 로그아웃 모달 확인 시 확실한 로그아웃 및 `/auth` 리다이렉션 보장.

### **3. OpenAI API 키 인증 오류**
- **문제**: "Your authentication token is not from a valid issuer" 메시지와 함께 AI 챗봇 응답 실패.
- **원인**: OpenAI API 키가 `.env.local`에 정확히 설정되지 않았거나, 서버 재시작이 안되어 변경된 키가 적용되지 않음.
- **해결**: 사용자가 `.env.local` 파일에 `OPENAI_API_KEY`를 올바르게 입력하고 서버를 재시작하여 문제 해결. `src/lib/ai.ts`에서 API 키 존재 여부 확인 로직 유지.

### **4. 서버 실행 경로 및 빌드 캐시 문제**
- **문제**: 수정 사항이 반영되지 않거나, 404 오류, 빈 화면 등 발생.
- **원인**: 개발 서버 실행 경로 오류 (`C:\Dictionary` vs `C:\Dictionary\korean-learning-app`), `.next` 폴더의 빌드 캐시 문제.
- **해결**:
  - 항상 `korean-learning-app` 폴더 내에서 `npm run dev` 명령어를 실행해야 합니다.
  - PowerShell에서 여러 명령어를 한 줄에 실행 시 `&&` 대신 `;`를 사용하거나, 각 명령어를 개별 라인에서 실행하세요.
  - 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다. (포트 사용 중일 시 `3001` 등 다른 포트로 자동 변경될 수 있음)
  - 환경변수(`.env.local`) 변경 후에는 반드시 개발 서버를 재시작해야 변경사항이 적용됩니다.

### **5. `async/await` 클라이언트 컴포넌트 사용 오류**
- **문제**: "Error: async/await is not yet supported in Client Components" 발생.
- **원인**: 클라이언트 컴포넌트 내 `onClick` 핸들러 등에서 `async/await` 직접 사용.
- **해결**: 해당 부분을 `.then().catch()` 프로미스 체인으로 변경.

### **6. 기타 (이전 문제들 요약)**
- **한글 인코딩 문제**: `page.tsx` 등 파일 내 한글 주석/텍스트로 인한 문제 발생 시 영어로 대체하여 해결. (UTF-8 인코딩 일관성 유지)
- **`lucide-react` 및 React hook 관련 린터 오류**: 패키지 설치 확인 및 import 방식 수정으로 해결.

---

## 📝 수정된 주요 파일들 ⭐ **RECENTLY UPDATED**

### **인증, 세션, 페이지 로직**
- `src/app/page.tsx`: 세션 관리, 자동 로그아웃, 리다이렉션 로직 대폭 수정 및 안정화. 헤더 닉네임 표시 기능 추가.
- `src/app/auth/page.tsx`: `Auth` 컴포넌트를 활용한 로그인/회원가입 페이지. 세션에 따른 리다이렉션 로직 포함.
- `src/components/Auth.tsx`: Supabase UI Auth 컴포넌트 커스터마이징 및 환경변수 참조.
- `src/lib/supabaseClient.ts`: 클라이언트 컴포넌트용 Supabase 클라이언트 인스턴스 생성 및 관리 (신규 추가).
- `src/lib/supabase.ts`: (필요시) 서버 사이드 Supabase 클라이언트 인스턴스 (Service Role Key 사용 등).
- `src/lib/auth.ts`: (내용 검토 및 필요시 업데이트) 자동 로그아웃 로직 일부, 역할 기반 인증 로직 (현재는 이메일 기반).

### **API 라우트**
- `src/app/api/chat/route.ts`: OpenAI API 호출 로직, 환경변수 `OPENAI_API_KEY` 참조.
- `src/app/api/questions/route.ts`: 질문 제출 API, Supabase Service Role Key 사용.
- `src/app/api/questions/[id]/route.ts`: 답변 추가/수정 API, Supabase Service Role Key 사용.
  (위 API 라우트들은 환경변수 대신 하드코딩된 키를 사용했던 부분을 `process.env` 참조로 변경 완료)

### **문서화**
- `ENV_SETUP.md`: 환경변수 설정 가이드 업데이트.
- `PROJECT_SUMMARY.md`: 현재 상태 반영하여 대폭 업데이트.
- `TROUBLESHOOTING.md`: (필요시) 최근 해결된 문제들 관련 내용 추가.

---

## 🚀 다음 단계 (우선순위별)

### **Phase 1: 핵심 기능 안정화 및 콘텐츠 기초 작업**
1.  **Supabase 인증 및 세션 관리 최종 점검** ✅ **거의 완료**
2.  **`roadmap.csv` 데이터베이스화 준비**: `ROADMAP_INTEGRATION.md` 기반으로 테이블 설계 및 마이그레이션 스크립트 작성 시작.
3.  **기본 페이지 콘텐츠 채우기**: `/my-page`, `/practice`, `/vocabulary` 등 핵심 기능 UI에 맞게 기본 콘텐츠 및 데이터 구조 정의.
4.  **사용자 학습 기록 시스템 설계**: 진도, 점수, 활동 등을 저장할 테이블 및 로직 구상.

### **Phase 2: AI 기능 확장**
1.  **AI 챗봇 기능 고도화**: 대화 목록 저장/로드, 컨텍스트 유지 개선.
2.  **벡터 검색 활용**: `dic` 테이블 및 `roadmap.csv` 기반 지식으로 답변 생성 품질 향상.
3. **AI 기반 학습 추천**: (장기) 사용자 데이터 기반 맞춤형 학습 경로 제안.

### **Phase 3: 고급 기능 및 사용성 개선**
1.  **실시간 알림 시스템**: (장기) 새 질문, 답변 등에 대한 알림.
2.  **학습 분석 대시보드**: (장기) 학습자/선생님용 통계 및 분석.
3.  **다국어 지원 준비**: (장기) UI 텍스트 분리 및 번역 준비.

### **Phase 4: 실제 연습 콘텐츠 제작 및 통합**
1.  **듣기/말하기/대화완성/번역 연습**: 실제 콘텐츠 제작 및 시스템 연동.

---

## 📂 프로젝트 구조 (주요 변경사항 위주)

```
korean-learning-app/
├── src/
│   ├── app/
│   │   ├── auth/page.tsx                 # 로그인/회원가입 페이지
│   │   ├── my-page/page.tsx              # 마이페이지
│   │   ├── korean-qa/page.tsx            # 한국어 Q&A
│   │   ├── practice/page.tsx             # 한국어 연습
│   │   ├── vocabulary/page.tsx           # 단어 학습
│   │   ├── teacher-dashboard/page.tsx    # 선생님 대시보드
│   │   ├── api/
│   │   │   ├── chat/route.ts             # 챗봇 API
│   │   │   ├── questions/route.ts        # 질문 목록/생성 API
│   │   │   └── questions/[id]/route.ts   # 특정 질문 답변/수정 API
│   │   ├── layout.tsx                    # 루트 레이아웃
│   │   ├── page.tsx                      # 홈페이지 (메인 대시보드 역할)
│   │   └── globals.css                   # 글로벌 스타일
│   ├── lib/
│   │   ├── supabaseClient.ts             # 클라이언트용 Supabase 인스턴스 ⭐ NEW
│   │   ├── supabase.ts                   # 서버용 Supabase 인스턴스 (필요시 구분)
│   │   ├── ai.ts                         # AI SDK 및 관련 로직
│   │   └── auth.ts                       # 인증 관련 헬퍼 함수 (필요시 검토)
│   ├── components/
│   │   ├── Auth.tsx                      # Supabase UI Auth 컴포넌트
│   │   ├── ProtectedRoute.tsx            # (사용 여부 확인) 인증 보호 컴포넌트
│   │   └── TTSButton.tsx                 # (사용 여부 확인) 음성 읽기 버튼
│   └── types/
│       └── supabase.ts                   # Supabase 자동 생성 타입 (필요시 재생성)
├── data/
│   └── roadmap.csv                       # 학습 커리큘럼 데이터
├── public/                               # 정적 에셋
├── ENV_SETUP.md                          # 환경변수 설정 가이드 ⭐ UPDATED
├── ROADMAP_INTEGRATION.md                # roadmap.csv 연동 계획
├── TROUBLESHOOTING.md                    # 문제 해결 가이드
├── PROJECT_SUMMARY.md                    # 프로젝트 진행사항 정리 ⭐ UPDATED
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .env.local                            # (Git 무시) 실제 환경변수 파일
```

---

## 🔧 개발 환경 설정

### **요구사항**
- Node.js 18+
- npm 또는 yarn

### **설치 및 실행** ⭐ **중요: 올바른 디렉토리에서 실행**
```bash
# 0. 프로젝트 루트 디렉토리로 이동 (예: C:\Dictionary\korean-learning-app)
cd path/to/korean-learning-app

# 1. 의존성 설치 (최초 실행 또는 package.json 변경 시)
npm install

# 2. .env.local 파일 설정 (ENV_SETUP.md 참고)
#    - NEXT_PUBLIC_AUTH_SUPABASE_URL
#    - NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY
#    - NEXT_PUBLIC_LEARNING_SUPABASE_URL
#    - NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY
#    - OPENAI_API_KEY
#    - (선택) AUTH_SUPABASE_SERVICE_ROLE_KEY
#    - (선택) LEARNING_SUPABASE_SERVICE_ROLE_KEY
#    - (선택) NEXT_PUBLIC_ADMIN_EMAIL (기본값: kpark71@hanmail.net)

# 3. 개발 서버 실행
npm run dev
```

**⚠️ 주의사항**: 
- 반드시 `korean-learning-app` 디렉토리 내에서 `npm run dev` 명령어를 실행해야 합니다.
- PowerShell에서 여러 명령어를 한 줄에 실행 시 `&&` 대신 `;`를 사용하거나, 각 명령어를 개별 라인에서 실행하세요.
- 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다. (포트 사용 중일 시 `3001` 등 다른 포트로 자동 변경될 수 있음)
- 환경변수(`.env.local`) 변경 후에는 반드시 개발 서버를 재시작해야 변경사항이 적용됩니다.

---

## 📊 현재 완성도 ⭐ **SIGNIFICANTLY IMPROVED**

| 기능 영역                 | 완성도 | 상태        | 비고                                     |
|---------------------------|--------|-------------|------------------------------------------|
| UI/UX 시스템 (기본)       | 95%    | ✅ 거의 완료  | 페이지별 세부 UI 조정 필요               |
| 페이지 구조 및 라우팅     | 100%   | ✅ 완료       |                                          |
| **인증 시스템 (Supabase)** | **95%**| ✅ **안정화** | 에러 핸들링, UX 개선 지속                |
| **세션 관리/자동 로그아웃**| **90%**| ✅ **안정화** | 예외 케이스 테스트 필요                  |
| **선생님 관리자 시스템**  | 70%    | 🟡 진행 중    | API 연동은 되었으나, UI/UX 및 세부 기능 구현 필요 |
| 권한 관리 (기본)          | 90%    | ✅ 거의 완료  | 이메일 기반 관리자 확인 (역할 기반 확장 가능) |
| **AI 챗봇 기본 기능**     | **85%**| ✅ **개선됨**   | OpenAI API 연동, 기본 응답 안정화        |
| 대화 관리 기능            | 30%    | 🟡 계획됨     | 저장/로드/삭제 기능 구현 필요           |
| **환경 변수 처리**        | **100%**| ✅ **안정화** | `supabaseClient.ts` 및 `.env.local`      |
| **기술적 안정성/디버깅**  | **90%**| ✅ **개선됨**   | 주요 오류 해결, 로깅 추가                |
| 데이터베이스 연동 (API)   | 80%    | ✅ 거의 완료  | 질문/답변 API 등 핵심 API 동작 확인      |
| 학습 콘텐츠 연동          | 10%    | 🟡 계획됨     | `roadmap.csv` 및 기타 콘텐츠 통합 전      |
| **문서화**                | 70%    | 🟡 진행 중    | 주요 문서 업데이트 완료, 지속적 관리 필요 |

**전체 진행률: 약 75~80%** (핵심 기능 안정화 및 주요 오류 해결, 콘텐츠 및 세부 기능 구현 단계)

---

## ✨ 최근 주요 성과 ⭐ **NEW & CRITICAL**

### **사용자 경험 및 안정성 대폭 개선**
- ✅ **로그인/세션 처리 안정화**: `page.tsx` 및 `auth/page.tsx` 로직 개선으로 무한 루프 및 리다이렉션 오류 해결.
- ✅ **Supabase 클라이언트 일원화**: `src/lib/supabaseClient.ts` 도입으로 클라이언트 측 Supabase 인스턴스 중복 생성 방지 및 관리 용이성 증대.
- ✅ **환경 변수 로드 안정화**: `.env.local` 파일의 환경 변수를 일관되게 참조하도록 수정하여 `Missing ... environment variables` 오류 해결.
- ✅ **OpenAI API 키 인증 문제 해결**: "invalid issuer" 오류 해결로 AI 챗봇 기능 정상화.
- ✅ **자동 로그아웃 기능 개선**: 모달 확인 후 정상 로그아웃 및 리다이렉션.
- ✅ **헤더 닉네임 표시**: 사용자 편의를 위해 이메일 대신 닉네임(없을 시 이메일)을 헤더에 표시.
- ✅ **주요 API 환경 변수 참조**: 이전에 하드코딩되었던 API 라우트의 Supabase 키들을 환경 변수 참조로 변경 완료.

### **개발 효율성 및 문제 해결**
- ✅ **명확한 서버 실행 가이드**: `korean-learning-app` 디렉토리에서 명령어 실행 및 `.next` 폴더 정리 등 트러블슈팅 가이드라인 확보.
- ✅ **클라이언트 컴포넌트 오류 해결**: `async/await` 관련 오류 수정.
- ✅ **문서화 업데이트**: `ENV_SETUP.md`, `PROJECT_SUMMARY.md` 등 주요 문서를 최신 상태로 반영.

### **기능 구현 진척**
- ✅ 질문/답변 관련 API (`/api/questions`, `/api/questions/[id]`) 정상 작동 확인 (Supabase 연동).
- ✅ AI 챗봇 (`/api/chat`) OpenAI 연동 및 기본 응답 확인.

---

*마지막 업데이트: 2024-05-27* (실제 업데이트 시점으로 변경 필요)
*작성자: AI Assistant & User*
*최근 업데이트: 환경 변수, 세션 처리, Supabase 클라이언트, OpenAI API 인증 등 핵심 문제 해결 및 관련 문서 대폭 업데이트.* ⭐ **CRITICAL UPDATE**

</rewritten_file>