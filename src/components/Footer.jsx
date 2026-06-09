export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="foot-top" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
          <div className="foot-brand">
            <div className="wm">
              <b>PRO</b>CESS
            </div>
            <p>과정에 몰입하라. 코치가 매일 성장하는 가장 단단한 길을 만듭니다.</p>
          </div>
          <div className="foot-col">
            <h5>바로가기</h5>
            <a href="#lecture">전력분석 강의</a>
            <a
              href="/studio/index.html"
              target="_blank"
              rel="noopener"
            >
              프로세스 스튜디오
            </a>
            <a href="#app">앱 설치</a>
          </div>
        </div>
        <div className="foot-bot">
          <p>© 2026 PROCESS · 과정에 몰입하라. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
