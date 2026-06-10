export default function Hero() {
  return (
    <header className="hero" id="top">
      <div className="pitch">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <line x1="720" y1="0" x2="720" y2="900" />
          <circle cx="720" cy="450" r="120" />
          <circle cx="720" cy="450" r="3" />
          <rect x="0" y="270" width="170" height="360" />
          <rect x="0" y="370" width="70" height="160" />
          <rect x="1270" y="270" width="170" height="360" />
          <rect x="1370" y="370" width="70" height="160" />
        </svg>
      </div>
      <div className="container">
        <span className="hero-eyebrow">
          <span className="dot"></span>코치를 위한 학습 플랫폼
        </span>
        <h1>
          <span className="line l1">
            <span>과정에</span>
          </span>
          <span className="line l2">
            <span>몰입하라</span>
          </span>
        </h1>
        <div className="hero-wm wm">
          <b>WE LOVE</b> PROCESS
        </div>
        <p className="hero-sub">
          결과는 통제할 수 없지만, 과정은 매일 쌓을 수 있습니다. 경기를 읽고,
          분석하고, 현장에 적용하는 — 그 과정이 코치를 성장시킵니다.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#lecture">
            강의 보기
          </a>
          <a
            className="btn btn-ghost"
            href="/studio/index.html"
            target="_blank"
            rel="noopener"
          >
            스튜디오 열기 ↗
          </a>
        </div>
      </div>
      <div className="container">
        <div className="trust">
          <div className="item">
            <div className="n">K리그·대표팀</div>
            <div className="l">현장 출신 강사</div>
          </div>
          <div className="item">
            <div className="n">강의 + 실습</div>
            <div className="l">배우고, 직접 해본다</div>
          </div>
          <div className="item">
            <div className="n">중·고교팀 연계</div>
            <div className="l">실제 선수단에 적용</div>
          </div>
        </div>
      </div>
    </header>
  )
}
