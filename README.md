# TREE FILM Web

정식 사용자 경로는 `/`, 콘텐츠 스튜디오는 `/admin`이다. GitHub Pages는 이 저장소만 배포한다.

## 준비된 범위

- 방문객 사이트와 관리자 UI가 같은 정적 앱에 있다.
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
