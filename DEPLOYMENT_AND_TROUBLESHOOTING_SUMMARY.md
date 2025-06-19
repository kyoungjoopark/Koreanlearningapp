# 배포 및 트러블슈팅 요약 (2025-06-05)

이 문서는 `korean-learning-app`의 Render.com 배포 과정과 발생했던 주요 오류 및 해결 과정을 요약합니다.

---

## 1. 초기 UI 수정 사항

- **관용구 상세 페이지**:
    - '관용구/속담 선택'으로 돌아가는 링크가 없어 추가했습니다.
    - '레벨 선택으로 돌아가기' 링크의 위치를 콘텐츠 박스 안으로 이동시켜 UI를 개선했습니다.
    - 설명 텍스트의 폰트 스타일(굵기, 크기)을 예문과 동일하게 맞추어 통일성을 높였습니다.
- **관용구 레벨 선택 페이지**:
    - 이전 화면인 '표현 유형 선택'으로 돌아가는 링크를 추가하여 사용자 경험을 개선했습니다.

---

## 2. Render.com 배포 과정

1.  **Git 저장소 설정**:
    - `korean-learning-app` 폴더를 기준으로 Git 저장소를 생성했습니다.
    - `node_modules`, `.next` 등 불필요한 파일이 포함되지 않도록 `.gitignore` 파일을 설정했습니다.
    - GitHub 저장소(`kyoungjoopark/Koreanlearningapp`)에 프로젝트를 푸시했습니다.

2.  **Render.com 설정**:
    - **Web Service** 생성 및 GitHub 저장소 연결
    - **Runtime**: `Node`
    - **Build Command**: `npm install; npm run build`
    - **Start Command**: `npm start`
    - **환경 변수**: `env.example`을 기반으로 Supabase 및 OpenAI API 키 등 모든 필수 환경 변수를 설정했습니다.

---

## 3. 주요 빌드 오류 및 해결 과정

배포 과정에서 여러 빌드 오류가 발생했으며, 아래와 같이 해결했습니다.

### 가. `next/headers` 클라이언트 컴포넌트 사용 오류

- **문제**: 서버 컴포넌트 전용 기능(`cookies` 등)을 클라이언트 컴포넌트(`'use client'`)에서 사용하려고 하여 발생했습니다.
- **해결**:
    - `learn/expressions/[type]/[level]/page.tsx` 파일을 서버 컴포넌트로 리팩토링했습니다.
    - 서버에서 데이터를 미리 가져온 뒤, UI 렌더링을 담당하는 클라이언트 컴포넌트(`IdiomsClientPage.tsx`)에 props로 전달하는 구조로 변경했습니다.

### 나. TypeScript 타입 오류 (`...lesson`)

- **문제**: `api/progress/route.ts`에서 데이터베이스 조회 결과가 `null`일 수 있는 배열에 전개 구문(`...`)을 사용하여 타입 에러가 발생했습니다.
- **해결**: `.map()`을 사용하기 전에 `.filter()`를 통해 `null` 이나 `undefined` 값을 확실히 제거하고, `map` 콜백에서 파라미터 타입을 `any`로 명시하여 타입 검사를 통과시켰습니다.

### 다. `useSearchParams()` 정적 페이지 생성 오류

- **문제**: `/auth` 페이지에서 클라이언트 전용 훅(`useSearchParams`)을 사용하고 있어, 서버가 빌드 시점에 페이지를 미리 생성(pre-render)하지 못했습니다.
- **해결**:
    - 1차 시도: `export const dynamic = 'force-dynamic'`을 추가했으나 해결되지 않았습니다.
    - 2차 해결: Next.js의 권장 방식에 따라, 기존 페이지 로직을 `AuthForm.tsx`라는 별도의 클라이언트 컴포넌트로 분리하고, `page.tsx`에서는 이 컴포넌트를 `<Suspense>`로 감싸서 렌더링하도록 구조를 변경했습니다.

### 라. 기타 오류
- **모듈 임포트 오류**: 존재하지 않는 컴포넌트를 `import`하는 코드가 남아있어 빌드 오류가 발생. 해당 라인을 삭제하여 해결했습니다.
- **환경 변수 누락**: `supabaseUrl is required` 오류 발생. `chat` API가 사용하는 `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY` 환경 변수가 Render.com에 설정되지 않은 것이 원인이었습니다. 필수 환경 변수 목록을 확인하고 추가하여 해결했습니다.

---

## 4. 성능 튜닝 및 런타임 이슈 해결

### 가. 로그인 후 화면 멈춤 현상

- **문제**: 로그인 성공 메시지 후 다음 페이지로 넘어가지 않고 멈추는 현상이 발생했습니다. `router.push()` 직전에 호출된 불필요한 `router.refresh()`가 원인으로 추정되었습니다.
- **해결**: `AuthForm.tsx`에서 `router.refresh()` 코드를 삭제하여 문제를 해결했습니다.

### 나. 이미지 최적화

- **문제**: 빌드 로그에서 이미지 최적화를 위한 `sharp` 라이브러리 설치가 계속 권장되었습니다.
- **해결**: `npm install sharp`를 통해 라이브러리를 설치하고, 변경사항을 배포에 반영하여 이미지 처리 성능을 향상시켰습니다.

### 다. Supabase 보안 경고

- **문제**: `onAuthStateChange`에서 반환된 세션 정보를 그대로 사용하여 보안에 취약하다는 경고가 발생했습니다.
- **해결**: `Header.tsx` 컴포넌트에서 `onAuthStateChange`는 로그인/로그아웃 "알림" 역할로만 사용하고, 실제 사용자 정보는 안전한 `supabase.auth.getUser()`를 통해 서버로부터 다시 가져오도록 로직을 수정했습니다.

---

여기까지가 지금까지의 작업 내용입니다. 내일 추가 테스트 시 이 문서를 참고하시면 도움이 될 것입니다. 수고 많으셨습니다! 