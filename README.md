# TREE FILM Web

정식 사용자 경로는 `/`이며 `/admin`은 개발 환경의 로컬 편집 데모다. GitHub Pages는 이 저장소만 배포한다.

## 준비된 범위

- 운영 빌드는 방문객 사이트만 제공하며, 관리자 편집기는 실제 인증 연결 전까지 개발 환경에서만 사용할 수 있다.
- GitHub Pages 프로젝트 URL의 새로고침(`/admin`)을 위한 404 fallback이 포함되어 있다.
- Firebase 웹 설정값을 넣을 `.env.example`이 있다. 이 값은 비밀이 아니며, 서비스 계정 키는 절대 이 저장소에 넣지 않는다.
- 현재 편집 저장소는 로컬 브라우저 IndexedDB다. Firebase 어댑터는 body 레포의 보안 규칙과 함께 연결한다.

## 첫 연결

GitHub에서 빈 공개 레포 `tree-film-web`을 만든 뒤 아래 한 줄을 실행한다.

```bash
./scripts/connect-web.sh git@github.com:YOUR_ACCOUNT/tree-film-web.git
```

GitHub Pages 설정에서 Source를 `GitHub Actions`로 선택한다. 커스텀 도메인을 연결할 때는 workflow의 `VITE_BASE_PATH`를 `/`로 바꾼다.

## 로컬 실행

```bash
mise install
mise run dev
```

`mise.toml`은 Node 22.23.3을 고정하고, `package.json`의 pnpm 11.19.0을 Corepack으로 실행한다.

## 공개 코드 경계

- 프론트 범위:
  - 방문객·관리자 UI와 공개 Firebase 웹 설정만 포함한다. 서버·DB 보안 규칙·Admin SDK·서비스 계정은 body에서 관리한다.
  - 현재 IndexedDB 편집기는 로컬 데모이며 실제 관리자 인증이나 서버 데이터 접근 권한을 제공하지 않는다. 운영 연결에는 Firebase Auth와 body의 admin claim 검증이 필요하다.
- 내보내기 검사:
  - `pnpm check:public-boundary`는 HEAD의 추적 파일을 검사하며, 미커밋 파일·전체 Git 이력·외부 Secret 저장소는 검사하지 않는다.
  - `.env.example`에는 공개 설정의 빈 자리만 두며, 비밀번호·비밀 키는 프론트에 넣지 않는다.
