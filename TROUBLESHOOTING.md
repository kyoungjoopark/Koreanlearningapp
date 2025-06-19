# 한국어 학습 앱 문제 해결 가이드

## 📋 발생한 주요 문제들

### 1. Next.js 모듈 관련 에러
- **오류**: `Cannot find module 'next/dist/compiled/next-server/app-page.runtime.dev.js'`
- **오류**: `Can't resolve 'next/dist/pages/_app'`

### 2. 404 에러 지속 발생
- **증상**: 서버는 실행되지만 페이지에서 "404 This page could not be found" 표시
- **원인**: 한글 인코딩 문제로 인한 페이지 파일 손상

### 3. 한글 인코딩 문제
- **증상**: `src/app/page.tsx` 파일의 한글 텍스트가 깨져서 저장됨
- **예시**: "한국어 학습 앱" → "?쒓뎅???숈뒿 ??"

### 4. 환경변수 파일 누락
- **문제**: `.env.local` 파일이 없어서 Supabase 연결 실패

## 🔧 시도한 해결 방법들

### 1. Next.js 캐시 및 의존성 정리
```powershell
# 서버 종료
taskkill /f /im node.exe

# 캐시 및 의존성 삭제
Remove-Item -Recurse -Force .next, node_modules, package-lock.json -ErrorAction SilentlyContinue

# 의존성 재설치
npm install
```

### 2. 환경변수 파일 생성
```powershell
# 환경변수 파일 생성
Copy-Item env.example .env.local
```

### 3. 한글 인코딩 문제 해결
- **해결책**: 한글 텍스트를 영어로 교체
- **수정된 파일**: `src/app/page.tsx`
- **변경 사항**: 
  - "한국어 학습 앱" → "Korean Learning App"
  - "서버가 정상적으로 작동하고 있습니다!" → "Server is running successfully!"

### 4. 포트 변경 시도
```powershell
# 다른 포트에서 실행
npx next dev -p 3001
```

## 🚀 현재 작동하는 설정

### 디렉토리 구조
```
C:\Dictionary\korean-learning-app\
├── src/
│   └── app/
│       └── page.tsx (영어 버전)
├── package.json
├── .env.local
└── ...
```

### 서버 실행 명령어
```powershell
# 올바른 디렉토리로 이동
cd C:\Dictionary\korean-learning-app

# 서버 실행
npm run dev
```

### 접속 URL
- **메인**: http://localhost:3000
- **대체**: http://localhost:3001

## ⚠️ 주의사항

### 1. 디렉토리 위치
- 반드시 `C:\Dictionary\korean-learning-app` 디렉토리에서 명령어 실행
- `C:\Dictionary`에서 실행하면 package.json을 찾을 수 없음

### 2. 한글 인코딩
- Windows PowerShell에서 한글 파일 편집 시 인코딩 문제 발생 가능
- 한글 텍스트 사용 시 UTF-8 인코딩 확인 필요

### 3. 캐시 문제
- 문제 발생 시 `.next` 폴더 삭제 후 재시작

## 🔄 재부팅 후 실행 순서

1. **디렉토리 이동**
   ```powershell
   cd C:\Dictionary\korean-learning-app
   ```

2. **서버 실행**
   ```powershell
   npm run dev
   ```

3. **브라우저에서 확인**
   - http://localhost:3000 접속
   - "Korean Learning App" 페이지 확인

4. **문제 발생 시**
   ```powershell
   # 캐시 삭제
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   
   # 서버 재시작
   npm run dev
   ```

## 📱 정상 작동 확인 방법

✅ **성공 시 표시되는 내용:**
- 제목: "🎉 Korean Learning App"
- 메시지: "Server is running successfully!"
- 3개의 기능 카드 (Korean Q&A, Korean Practice, Word Learning)
- 녹색 "✅ Test Success" 섹션

❌ **실패 시 나타나는 증상:**
- "404 This page could not be found"
- "ERR_CONNECTION_REFUSED"
- 한글이 깨져서 표시됨

## 📞 추가 도움이 필요한 경우

1. **포트 충돌 시**: 다른 포트 사용 (`npx next dev -p 3001`)
2. **모듈 에러 시**: 전체 재설치 (`npm install`)
3. **인코딩 문제 시**: 파일을 영어로 다시 작성

---
*마지막 업데이트: 2025-05-23*
*상태: 한글 인코딩 문제로 인한 404 에러 해결 중* 