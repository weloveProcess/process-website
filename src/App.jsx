import StudioShell from './components/StudioShell'

// 메인 페이지 = 코치 스튜디오. 루트(/)로 접속하면 작전판/주기화가 바로 열린다.
// 기존 마케팅 랜딩 컴포넌트(Hero·Lecture·Creed 등)는 src/components 에 남아 있으며
// 추후 react-router 로 /about 같은 별도 경로에 다시 붙일 수 있다.
export default function App() {
  return <StudioShell />
}
