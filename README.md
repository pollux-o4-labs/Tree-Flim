# TREE FILM Web

## 운영

- 사용자 경로:
  - `/`는 공개 포트폴리오, `/admin`은 이메일·비밀번호 관리자 로그인이다.
  - Firebase Auth의 admin claim과 Firestore 서버 규칙으로 편집 권한을 확인한다.
- 데이터:
  - 초안과 발행본은 Firestore에 저장한다. 공개 이미지 URL은 외부 제공자가 전송한다.
  - Firebase 웹 설정과 공개 Drive 브라우저 키는 공개 설정이다. 비밀번호·서비스 계정·DB 규칙은 포함하지 않는다.
  - 로컬 데모의 IndexedDB 데이터는 자동으로 업로드하지 않는다. 기존 화면에서 초안을 내보내고 운영 편집기에서 가져온다.

## 실행과 검증

- 개발:
  - `pnpm install --frozen-lockfile`, `pnpm dev`를 실행한다.
  - 프로젝트 Pages 경로는 `VITE_BASE_PATH=/Tree-Flim/ pnpm build`로 빌드한다. preview에도 같은 환경 변수를 전달한다.
- 검증:
  - `E2E_CREDENTIALS_FILE`에는 Git 밖의 권한 제한된 JSON 파일 경로를 지정한다. 형식은 email, password 두 필드다.
  - `E2E_BASE_URL`을 배포 URL로 설정하고 `pnpm exec playwright test --config playwright.deployment.config.ts`를 실행한다.
  - 발행 테스트는 임시 제목을 실제 저장·발행하고 원래 제목으로 복구한다. 운영 콘텐츠를 수정 중인 사람과 실행 시점을 조율한다.
- 배포:
  - main push 한 번으로 GitHub Pages를 빌드·배포한다. 하위 경로 새로고침을 위한 404 fallback을 포함한다.
  - `pnpm check:public-boundary`는 HEAD 추적 파일을 검사한다. 전체 Git 이력이나 외부 Secret 저장소 검사는 별도다.
