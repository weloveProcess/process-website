export default function AppSection() {
  return (
    <section className="app sec" id="app">
      <div className="container">
        <div className="app-wrap">
          <div className="app-copy reveal">
            <div className="kicker">THE APP</div>
            <h2>
              현장은 손 안에서
              <br />
              계속됩니다
            </h2>
            <p>
              이동 중에도, 그라운드 옆에서도. 영상 강의·세션·노트를 한 곳에서.
              PROCESS 앱으로 학습이 끊기지 않습니다.
            </p>
            <ul className="app-feats">
              <li>
                <span className="ck">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#3f8ac0" strokeWidth="3">
                    <path d="M5 12l5 5L20 6" />
                  </svg>
                </span>
                오프라인 저장 — 데이터 없이도 보는 강의
              </li>
              <li>
                <span className="ck">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#3f8ac0" strokeWidth="3">
                    <path d="M5 12l5 5L20 6" />
                  </svg>
                </span>
                세션 노트 — 보면서 바로 기록
              </li>
              <li>
                <span className="ck">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#3f8ac0" strokeWidth="3">
                    <path d="M5 12l5 5L20 6" />
                  </svg>
                </span>
                학습 이어보기 — 멈춘 지점부터 다시
              </li>
            </ul>
            <div className="store-row">
              <a className="store" href="#">
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M17.05 12.5c0-1.7.9-3.1 2.3-3.9-.8-1.1-2-1.8-3.5-1.9-1.5-.1-3.1 1-3.9 1-.8 0-2.1-1-3.4-1-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.3-.8 1.5 0 2 .8 3.4.8 1.4 0 2.3-1.2 3.1-2.5.6-.9 1.1-1.9 1.4-2.9-1.5-.6-2.7-2.2-2.7-4.2zM14.6 5.1c.7-.9 1.2-2 1-3.1-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
                </svg>
                <span>
                  <span className="st">설치 없이</span>
                  <span className="lg">홈 화면에 추가</span>
                </span>
              </a>
              <a className="store" href="#">
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1L13 12.1v-.2L3.6 2.3zM16.3 15.4l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2l-3.8 2zM15.7 16l-3.2-3.2L3.6 21.7c.4.4 1 .4 1.7.1l10.4-5.8zM5.3 2.2L15.7 8 12.5 11.2 3.6 2.3c.5-.3 1.1-.3 1.7-.1z" />
                </svg>
                <span>
                  <span className="st">브라우저에서</span>
                  <span className="lg">바로 설치</span>
                </span>
              </a>
            </div>
          </div>
          <div className="phone-stage reveal">
            <div className="phone">
              <div className="notch"></div>
              <div className="phone-screen">
                <svg className="ps-field" viewBox="0 0 240 480">
                  <line x1="0" y1="240" x2="240" y2="240" />
                  <circle cx="120" cy="240" r="50" />
                  <rect x="60" y="0" width="120" height="50" fill="none" />
                  <rect x="60" y="430" width="120" height="50" fill="none" />
                </svg>
                <div className="ps-wm">
                  <b>PRO</b>CESS
                </div>
                <div className="ps-sub">오늘의 학습</div>
                <div className="ps-cards">
                  <div className="ps-card">
                    <div className="t">마스터클래스 · 후방 빌드업</div>
                    <div className="b">이어보기 · 18:24 남음</div>
                    <div className="bar">
                      <i></i>
                    </div>
                  </div>
                  <div className="ps-card">
                    <div className="t">세션 노트 · U-16 전환 수비</div>
                    <div className="b">3개 메모</div>
                  </div>
                  <div className="ps-card">
                    <div className="t">코치 인터뷰 · 새 글</div>
                    <div className="b">12분 읽기</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
