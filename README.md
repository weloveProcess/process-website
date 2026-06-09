# PROCESS · 과정에 몰입하라

코치를 위한 한국형 코칭 학습 플랫폼 PROCESS의 홈페이지입니다.
마스터클래스 · 현장 인터뷰 · 훈련 프로그램 · 앱(PWA)을 소개합니다.

## 구성

| 파일 | 설명 |
| --- | --- |
| `index.html` | 메인 홈페이지 |
| `course.html` | 전력분석 강의 (입문·심화 8강) |
| `manifest.json` | PWA 설정 (앱 설치용) |
| `sw.js` | 서비스 워커 (오프라인 캐시) |
| `icon-192.png`, `icon-512.png` | 앱 아이콘 |
| `instructor.jpg` | 강사 이미지 |

## 로컬에서 보기

별도 빌드가 필요 없는 정적 사이트입니다.

```bash
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 협업 규칙

- 작업은 각자 브랜치를 만들어 진행하고, `main`에는 Pull Request로 합칩니다.
- 커밋 메시지는 무엇을 바꿨는지 한 줄로 적어주세요.
