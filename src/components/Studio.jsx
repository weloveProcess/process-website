export default function Studio() {
  return (
    <section className="studio sec" id="studio">
      <div className="container">
        <div className="sec-head reveal">
          <div className="kicker">PROCESS STUDIO</div>
          <h2>
            보는 것을 넘어,
            <br />
            직접 그리고 설계합니다
          </h2>
          <p>
            프로세스 스튜디오 — 작전판, 훈련 일정, 게임 모델이 하나로. 머릿속
            전술을 화면 위에 그리고 그대로 현장에 가져가세요.
          </p>
        </div>
        <div className="studio-grid reveal">
          <div className="smod">
            <div className="smod-vis">
              <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
                <line className="ln" x1="160" y1="0" x2="160" y2="200" />
                <circle className="ln" cx="160" cy="100" r="34" />
                <circle className="pl2" cx="70" cy="70" r="6" />
                <circle className="pl2" cx="70" cy="130" r="6" />
                <circle className="pl2" cx="120" cy="100" r="6" />
                <circle className="pl" cx="210" cy="80" r="6" />
                <circle className="pl" cx="230" cy="130" r="6" />
                <path className="pa" d="M70 70 L120 100 L210 80" />
              </svg>
            </div>
            <div className="smod-body">
              <div className="si">Board</div>
              <h4>작전판</h4>
              <p>
                전술과 세션을 그리고, 애니메이션·영상으로 내보냅니다. 선수에게
                보여줄 한 장면을 그대로.
              </p>
            </div>
          </div>
          <div className="smod">
            <div className="smod-vis">
              <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
                <line className="ln" x1="40" y1="50" x2="280" y2="50" />
                <line className="ln" x1="40" y1="100" x2="280" y2="100" />
                <line className="ln" x1="40" y1="150" x2="280" y2="150" />
                <rect className="pl" x="56" y="38" width="48" height="22" rx="4" />
                <rect className="pl2" x="130" y="88" width="70" height="22" rx="4" />
                <rect className="pl" x="92" y="138" width="40" height="22" rx="4" />
                <rect className="pl2" x="200" y="138" width="56" height="22" rx="4" />
              </svg>
            </div>
            <div className="smod-body">
              <div className="si">Schedule</div>
              <h4>훈련 일정</h4>
              <p>
                경기일(MD) 기준으로 한 주를 자동 주기화. 각 훈련 블록에 작전판
                장면을 바로 첨부합니다.
              </p>
            </div>
          </div>
          <div className="smod">
            <div className="smod-vis">
              <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
                <rect className="ln" x="40" y="36" width="240" height="128" />
                <line className="ln" x1="160" y1="36" x2="160" y2="164" />
                <circle className="ln" cx="160" cy="100" r="26" />
                <path className="pa" d="M60 100 L120 70 L120 130 Z" />
                <path className="pa" d="M260 100 L200 70 L200 130 Z" />
              </svg>
            </div>
            <div className="smod-body">
              <div className="si">Game Model</div>
              <h4>게임 모델</h4>
              <p>
                빌드업·공격·전환·수비 4국면별 우리 팀의 플레이 원칙을 정리하고
                문서로 내보냅니다.
              </p>
            </div>
          </div>
        </div>
        <div className="studio-cta reveal">
          <div className="t">
            프로세스 스튜디오, 지금 열어보세요
            <span>설치 없이 브라우저에서 바로 · 작전판 · 일정 · 게임 모델</span>
          </div>
          <a
            className="btn btn-primary"
            href="/studio/index.html"
            target="_blank"
            rel="noopener"
          >
            스튜디오 열기 →
          </a>
        </div>
      </div>
    </section>
  )
}
