# PROCESS STUDIO · 코치 스튜디오

코치를 위한 스튜디오. **Vite + React + Supabase**, **Netlify** 배포.

**메인 페이지(`/`)가 곧 스튜디오**입니다 — 접속하면 작전판/주기화가 바로 열립니다.
상단에서 **카카오·구글 로그인** 후, 앱의 기존 저장/불러오기 버튼이 **Supabase에 사용자별로**
데이터를 저장/조회합니다(로그인 안 하면 로컬에서만 동작).

## 개발 내역 (구현 기능)

> 이 저장소는 **개발할 때마다 이 섹션에 내용을 누적 기록**합니다.

### 2026-06-15 — 스튜디오 다국어(i18n) 6개국어
- 스튜디오 전체(React 셸 + board·process·scout·note·gamemodel 서브앱)를 **한·日·EN·中·ES·PT** 6개 언어로 번역.
- **런타임 DOM 번역 엔진**(`public/studio/i18n.js`, 최종본 index(5) 이식): `DICT`(정확 일치) +
  `RULES`(정규식 동적 문자열)로 한국어 UI 를 치환. `MutationObserver` 로 동적 생성 콘텐츠까지 자동 번역.
  같은 출처 iframe 의 `contentDocument` 를 부모(셸)에서 직접 `register` → 서브앱 코드 수정 없이 동시 번역
  (postMessage 불필요). localStorage 키 `cs_lang`.
- 셸 헤더에 언어 전환기(`.cs-langsw`), 각 iframe `onLoad` 에서 `window.csI18n.register()` 배선.
  `studio/index.html` 이 React 마운트 전에 `i18n.js` 로드.
- **번역 사전 약 1,370개 키**: index(5) DICT(881) + develop 서브앱 마크업/JS 라벨·드릴 라이브러리·토스트(약 490) 보강.
  미번역 잔여는 화면에 안 보이는 `<script>` 소스 텍스트뿐(실 UI 0).

### 2026-06-15 — 셸 기능 보강(웰컴·백업·공유) — 최종본 반영
- 최종본(임베디드 셸)에 있던 셸 레벨 기능을 React 스튜디오 셸(`src/components/StudioShell.jsx`)에 이식.
- **웰컴 화면**: 첫 방문 시 앱 소개 모달(`cs_welcomed_v1` 플래그), 가이드/시작 버튼.
- **설정(기어) 팝업 + 백업**: 사용법 가이드 링크, 데이터 백업 **내려받기/불러오기**(JSON).
  localStorage + IndexedDB(`window.storage.getAll()`)를 모두 수집·복원 — `idb-store.js` 에 `getAll()` 추가,
  셸(부모)에도 `idb-store.js` 로드(`studio/index.html`).
- **공유 링크**: 작전판·훈련 세션·주간 일정을 백엔드 없이 URL 해시로 공유.
  현재 앱의 `__exportShare()` → `deflate-raw`+base64url 압축(`zips`) → `#share=` 링크 클립보드 복사.
  수신 시 `#share=` 해시를 풀어(`unzips`) 뷰어로 표시, 작전판은 **내 작전판으로 불러오기**(`__importShare`).

### 2026-06-11 — 멀티페이지 통합(마케팅 홈 + 가이드)
- 별도 브랜치(`feat/home-i18n-myprocess`, `feat/studio-guide`)의 기능을 develop 구조에 맞게 통합.
- **Vite 멀티페이지**(`vite.config.js` `rollupOptions.input`): `/`=마케팅 홈, `/studio/`=React 스튜디오,
  `/guide/`=사용법 가이드. 기존 React 엔트리를 `studio/index.html` 로 이동, 루트는 마케팅 홈으로 교체.
- **마케팅 홈(`index.html`)**: 한·일·영 다국어(전체 텍스트노드 자동 번역), 마이프로세스·매니페스토 섹션,
  강의 신청(Google Form). "스튜디오 열기"를 외부 URL → 사이트 내 `/studio/` 로 연결, nav에 `사용법`→`/guide/` 추가.
- **사용법 가이드(`guide/index.html`)**: 작전판·훈련 디자인·일정·게임모델·스카우트 사용법, 한·일·영.
- 구 셸 `public/studio/index.html` 삭제(새 `studio/index.html` 엔트리와 충돌 방지). `favicon.png` 추가.

### 2026-06-10 — favicon 설정
- `index.html` 에 `<link rel="icon" href="/icon-512.png">` 추가 (favicon = public/icon-512.png).

### 2026-06-10 — 미팅 모드 전체화면 제거
- 보드 **미팅 탭**이 브라우저 전체화면(`requestFullscreen`)으로 진입하던 동작 제거.
  이제 **헤더(셸 앱바)만 숨기는** 포커스 모드만 동작(`setFocus`→`focusBoard` 메시지). 
  `enterFocus`/`exitFocus`에서 fullscreen 요청/해제 코드 삭제.

### 2026-06-10 — 게임모델 앱 추가 · 신규 기능 반영 · 로그인 버튼 이동
- **게임모델(Game Model) 앱 추가**: 4국면별 플레이 원칙 문서. `public/studio/gamemodel.html`,
  헤더 탭 `보드 / 일정 / 게임모델`. 게임모델 국면의 "작전판 첨부"는 보드 캡처 브리지로 연결
  (`openBoard`→캡처→`boardResult`, `captureReq`로 일정/게임모델 라우팅).
- **board/process 신규 기능 반영**: 사용자 신버전(세션에 `time`·`players` 필드, 현재 세션
  자동저장 `training_session_cur_v1` 등)을 베이스로 채택하고, 그 위에 Supabase 통합
  (StudioDB 항목별 저장/불러오기·단일상태 동기화·좌표 압축·사용자 격리)과 이전 UI 수정을 재적용.
- **게임모델 클라우드 동기화**: 단일 상태(`kind='gamemodel'`, `cs_gamemodel_v1`)로 일정과
  동일하게 저장/복원. 로그아웃 시 정리 키에 게임모델·현재세션 추가.
- **로그인 버튼 위치**: 헤더 맨 오른쪽에 디바이스 토글 유지, 그 왼쪽에 로그인 버튼 배치.

### 2026-06-10 — 작전판 탭 배경 통일
- **훈련 디자인 배경 통일**: 작전판/경기/미팅은 캔버스 `#dde1e8`(흰색 피치)인데 훈련 디자인만
  본문 `#ECEDF0`이라 탭 전환 시 배경색이 바뀌던 문제 수정. `#sessionView` 배경을 작전판
  캔버스(`var(--canvas)`)와 일치(흰색 피치 기준). 어두운 피치 모드는 폼 가독성 위해 밝은 배경 유지.

### 2026-06-10 — 주기화 UI 다듬기
- **드릴/훈련 편집 모달 스크롤**: 화면보다 긴 모달이 잘리던 문제 수정.
  `.sheet` 에 `max-height:calc(100dvh-24px)` + `overflow-y:auto` → 뷰포트 안에서 내부 스크롤.
- **"일정" 헤더 고정**: 투명 그라데이션 → 불투명 흰색 + 하단 보더로 셸 헤더 아래에 또렷이 고정.
- **데스크탑 배경 구분**: 거터(뒷 배경)는 어둡게(`#D4D7DD`), 760px 콘텐츠 컬럼은 밝은 페이지 +
  테두리·그림자로 프레이밍 → 흰 셸 헤더·하단 내비와 어울리게.

### 2026-06 — 스튜디오 메인 전환 · OAuth · Supabase 연동
- **메인 = 스튜디오**: 루트(`/`)에서 React 셸([`StudioShell.jsx`](src/components/StudioShell.jsx))이
  작전판([`board.html`](public/studio/board.html))·주기화([`process.html`](public/studio/process.html))를
  iframe 으로 띄움. 보드/주기화 토글·폰 미리보기·두 앱 간 postMessage 브리지 포함.
  (기존 마케팅 랜딩 컴포넌트는 `src/components/`에 보존, 현재 미사용.)
- **소셜 로그인(카카오·구글)**: [`AuthContext.jsx`](src/context/AuthContext.jsx) `signInWithOAuth`.
  카카오 스코프는 `profile_nickname` 만(이메일 X → 비즈앱 전환 불필요). 헤더
  [`AuthBar.jsx`](src/components/AuthBar.jsx)는 로그인/로그아웃·닉네임만 표시. 이메일/비번 모달 제거.
- **항목별 Supabase 저장/불러오기**: 배치(play)·세션(session, "훈련 디자인")·내 구성(template)을
  각각 `boards` 한 행으로 저장(`kind`, `title`=이름, `data`=내용). 불러오기 목록은
  Supabase에서 직접 조회. 앱↔셸은 [`db-bridge.js`](public/studio/db-bridge.js)(`window.StudioDB`)
  RPC → `StudioShell` 이 [`boards.js`](src/lib/boards.js)의 `dbList/dbGet/dbUpsert/dbDelete` 실행.
- **단일 상태 동기화**: 매치노트·경기정보·훈련일정 작업본은 사용자당 1행(`kind`=matchnotes/match/schedule)
  으로 자동 저장하고 로그인 시 복원.
- **사용자별 격리**: 로그인 시 Supabase(RLS 본인 행)만, 로그아웃 시 localStorage 만 사용 —
  서로 폴백하지 않음. 로그아웃 시 스튜디오 로컬 데이터 정리. (브라우저 공유 localStorage로
  인한 사용자 간 데이터 누수 방지.)
- **저장 용량 최적화**: 저장 직전 좌표 등 숫자를 소수 1자리로 반올림(`compact()`)해 스냅샷
  ~50% 축소(화면은 `.toFixed(1)` 렌더라 무손실). 불러오기 목록은 이름만 조회(data 지연 로드)로
  전송량 절감.
- **DB 스키마**: `profiles`·`boards` + RLS + 프로필 자동생성 트리거(소셜 nickname 대응) +
  이름 기준 upsert용 유니크 인덱스 `boards_user_kind_title_uidx`.

## 구조

```
process-website/
├─ index.html              # Vite 진입 HTML (meta/폰트/manifest)
├─ netlify.toml            # 빌드 + SPA 리다이렉트
├─ .env.example            # 환경변수 템플릿
├─ public/                 # 정적 파일 (manifest, sw, 아이콘, 강사사진)
│  ├─ manifest.json  sw.js  icon-192.png  icon-512.png  instructor.jpg  course.html
│  └─ studio/              # 코치 스튜디오 (바닐라 JS 앱)
│     ├─ board.html        #   작전판 + 훈련 디자인(세션) — iframe 으로 로드
│     ├─ process.html      #   주기화·훈련 일정 — iframe 으로 로드
│     ├─ db-bridge.js      #   window.StudioDB: 부모 셸 경유 Supabase RPC 브리지
│     └─ index.html        #   (구) 독립 셸 — 현재는 React StudioShell 이 대체
├─ supabase/
│  └─ schema.sql           # profiles + boards + RLS + 트리거 + 유니크 인덱스
└─ src/
   ├─ main.jsx             # 진입점 + SW 등록 + AuthProvider
   ├─ App.jsx              # StudioShell 렌더 (메인 = 스튜디오)
   ├─ index.css            # 전역 + 스튜디오 셸 스타일
   ├─ lib/
   │  ├─ supabase.js       # Supabase 클라이언트
   │  └─ boards.js         # 항목별/단일상태 저장·조회 헬퍼 (dbList/dbUpsert 등)
   ├─ context/
   │  └─ AuthContext.jsx   # 세션 상태 + 카카오/구글 OAuth + signOut
   ├─ hooks/               # useScrolled, useScrollReveal (랜딩용, 현재 미사용)
   └─ components/
      ├─ StudioShell.jsx   # 메인 셸: iframe·토글·브리지·DB RPC·로그인 동기화
      ├─ AuthBar.jsx       # 헤더: 카카오/구글 로그인 · 닉네임 · 로그아웃
      └─ Nav/Hero/Lecture/Studio/Creed/AppSection/Footer.jsx  # (구) 랜딩, 보존·미사용
```

## 1. 로컬 실행

```bash
npm install
cp .env.example .env      # 값 채우기 (아래 2번)
npm run dev               # http://localhost:5173
```

## 2. Supabase 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키 복사 → `.env` 에 입력
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. **SQL Editor** 에서 `supabase/schema.sql` 전체를 붙여넣고 **Run**
   - `profiles` (회원 정보) + `boards` (작전판·일정·내 구성 저장) 테이블 생성
   - RLS(행 수준 보안) 활성화 → 사용자는 본인 데이터만 접근
   - 회원가입 시 프로필 자동 생성 트리거 포함
   - `boards_user_kind_title_uidx` 유니크 인덱스 (이름 기준 저장/덮어쓰기에 필수)
   - ⚠️ 이미 한 번 Run 했더라도 **유니크 인덱스가 추가됐으니 다시 Run** 하세요
     (`if not exists`/`drop ... if exists` 라 여러 번 실행해도 안전)
4. **카카오·구글 소셜 로그인 설정** → 아래 ["내가 직접 해야 할 것"](#내가-직접-해야-할-것-소셜-로그인) 참고

### 저장 기능 사용 예 (스튜디오 앱에서 그대로 재사용 가능)

```js
import { saveBoard, listBoards } from './lib/boards'

// 작전판 저장
await saveBoard({ kind: 'board', title: '4-3-3 빌드업', data: studioState })

// 내 작전판 목록
const { data } = await listBoards('board')
```

> 작전판 저장은 `public/studio/board.html` 에서 동일한 `boards` 테이블/헬퍼를
> 그대로 쓰면 됩니다. 두 앱이 같은 Supabase 프로젝트를 바라보게 하세요.

## 코치 스튜디오 (public/studio/)

랜딩 페이지의 **"스튜디오 열기"** 버튼은 이제 외부 URL이 아니라
같은 사이트의 `/studio/` 를 엽니다 (Hero · Studio · Footer 세 곳 모두).

기존에는 작전판·주기화 앱이 하나의 HTML에 base64로 통째로 박혀 있었는데,
**기능별로 파일을 분리**했습니다:

- `studio/index.html` — 셸. `보드 / 주기화` 토글, 폰/데스크톱 미리보기,
  두 앱 사이 `postMessage` 브리지. 이제 base64 대신 `board.html` /
  `process.html` 을 `<iframe src>` 로 로드합니다.
- `studio/board.html` — 작전판 (드로잉 · 애니메이션 · 영상 내보내기)
- `studio/process.html` — 주기화 · 훈련 일정 설계

세 파일은 같은 폴더(동일 출처)에 있어 브리지(`parent.postMessage`)가 그대로
동작합니다. 각 앱을 수정할 때 해당 파일만 열면 됩니다.

> Vite 변환은 셸/랜딩만 적용했고, 스튜디오 내부 두 앱은 통합만(원본 바닐라 JS
> 유지) 했습니다. 추후 React로 옮기려면 이 폴더부터 단계적으로 진행하면 됩니다.

## 3. Netlify 배포

1. 이 폴더를 GitHub 저장소로 push
2. Netlify → **Add new site → Import an existing project** → 저장소 선택
3. 빌드 설정은 `netlify.toml` 이 자동 적용 (Build: `npm run build`, Publish: `dist`)
4. **Site settings → Environment variables** 에 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. 이후 push 마다 자동 재배포

배포 후 Supabase **Authentication → URL Configuration** 의
`Site URL` / `Redirect URLs` 에 Netlify 도메인을 추가하세요.

## 내가 직접 해야 할 것 (소셜 로그인)

코드(카카오·구글 로그인 버튼, OAuth 호출, 세션 처리, 클라우드 저장)는 이미 구현돼
있습니다. **외부 콘솔에서 앱을 등록하고 Supabase에 키를 넣는 일만** 남았습니다.
아래를 순서대로 따라 하면 로그인이 동작합니다.

> 공통으로 쓰는 콜백 주소(Authorized redirect URI):
> `https://<프로젝트ref>.supabase.co/auth/v1/callback`
> (`<프로젝트ref>` = Supabase URL 의 서브도메인. Supabase → Authentication →
> Providers 의 각 provider 설정 화면에 정확한 값이 그대로 표시됩니다 — 복붙 추천.)

### A. 구글 로그인

1. **Google Cloud Console** (console.cloud.google.com) → 프로젝트 생성/선택
2. **APIs & Services → OAuth consent screen** → External → 앱 이름·지원 이메일 입력 → 저장
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized redirect URIs** 에 위 콜백 주소 추가
4. 생성된 **Client ID / Client Secret** 복사
5. **Supabase → Authentication → Providers → Google** → 토글 ON → Client ID·Secret 붙여넣기 → Save

### B. 카카오 로그인

1. **Kakao Developers** (developers.kakao.com) → 내 애플리케이션 → 애플리케이션 추가
2. **앱 설정 → 플랫폼 → Web** 플랫폼 등록 (사이트 도메인: 배포 도메인 + `http://localhost:5173`)
3. **제품 설정 → 카카오 로그인** → 활성화 ON
   - **Redirect URI** 에 위 콜백 주소 추가
4. **카카오 로그인 → 동의 항목** → 필요한 항목(닉네임·프로필, 이메일 등) 사용 설정
   - 이메일은 비즈앱 전환이 필요할 수 있음(닉네임만으로도 로그인은 됨)
5. **앱 키**: `REST API 키` 복사 / **보안 → Client Secret** 발급(코드 생성 + 활성화 상태 ON)
6. **Supabase → Authentication → Providers → Kakao** → 토글 ON
   - **REST API Key** → Supabase 의 `Client ID(REST API Key)` 칸
   - **Client Secret** → Supabase 의 `Client Secret` 칸 → Save

### C. Supabase 리다이렉트 주소 등록 (필수)

**Authentication → URL Configuration**
- **Site URL**: 배포 도메인 (예: `https://your-site.netlify.app`)
- **Redirect URLs**: `http://localhost:5173`, 배포 도메인 둘 다 추가
  - 이게 없으면 로그인 후 돌아올 때 `redirect_to is not allowed` 오류가 납니다.

> 동작 확인: 버튼이 "로그인이 아직 설정되지 않았습니다(provider is not enabled)"
> 토스트를 띄우면 → 해당 provider 토글이 아직 OFF 인 것입니다.

## 그 외 남은 작업 (선택)

- `public/icon-192.png`, `public/icon-512.png`, `favicon` — PWA 아이콘
- 기존 마케팅 랜딩(Hero·Lecture·Creed 등)은 `src/components/` 에 그대로 남아 있습니다.
  다시 노출하려면 `react-router-dom` 을 추가해 `/about` 같은 경로에 붙이세요.
- 클라우드 저장은 사용자당 스냅샷 1개(`boards.kind='studio'`)를 upsert 합니다.
  여러 개의 명명된 작전판 저장이 필요하면 `src/lib/boards.js` 의 `saveBoard()` 를 활용하세요.

## 참고

- 환경변수는 반드시 `VITE_` 접두사 — 그래야 클라이언트 번들에 포함됩니다.
- `anon` 키는 공개돼도 안전합니다(클라이언트용). 보안은 RLS가 담당.
- `service_role` 키는 **절대** 프론트엔드/`.env`(VITE_)에 넣지 마세요.
