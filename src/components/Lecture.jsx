// 이미지는 public/ 폴더에 두고 절대경로로 참조 (public/instructor.jpg)
const instructorImg = '/instructor.jpg'

export default function Lecture() {
  return (
    <section className="sec" id="lecture">
      <div className="container">
        <div className="sec-head reveal">
          <div className="kicker">Lecture</div>
          <h2>전력분석 현장 강의</h2>
          <p>
            K리그·국가대표팀 현장을 거친 전력분석관의 실전 커리큘럼. 입문 4강으로
            '경기를 보는 눈'을, 심화 4강으로 '현장에서 쓰이는 리포트'를
            완성합니다. 그리고 배운 것은 운영 중인 중·고교 팀에서 직접
            적용해봅니다.
          </p>
        </div>
        <div className="prog-wrap">
          <div className="reveal">
            <div className="prog-list">
              <div className="prog-row">
                <span className="idx">01</span>
                <div className="info">
                  <h4>현강 입문 · 4강</h4>
                  <span>노테이셔널 분석부터 인사이트 전달까지</span>
                </div>
                <span className="dur">₩298,000</span>
              </div>
              <div className="prog-row">
                <span className="idx">02</span>
                <div className="info">
                  <h4>현강 심화 · 4강</h4>
                  <span>상대 분석 · 자팀 스카우팅 · 전달법</span>
                </div>
                <span className="dur">₩498,000</span>
              </div>
              <div className="prog-row">
                <span className="idx">03</span>
                <div className="info">
                  <h4>입문 + 심화 번들 · 8강</h4>
                  <span>가장 빠르게 현장 분석관 수준으로 · 실습 포함</span>
                </div>
                <span className="dur">₩698,000</span>
              </div>
              <div className="prog-row">
                <span className="idx">+</span>
                <div className="info">
                  <h4>중·고교팀 현장 실습</h4>
                  <span>배운 분석을 실제 선수단에 적용 → 코칭스태프 피드백</span>
                </div>
                <span className="dur">번들 포함</span>
              </div>
              <div className="prog-row">
                <span className="idx">→</span>
                <div className="info">
                  <h4>팀 추천 · 코치 연결</h4>
                  <span>
                    실력이 검증되면 초등부터 프로팀까지, 맞는 팀에 직접 추천
                  </span>
                </div>
                <span className="dur">수료 후</span>
              </div>
            </div>
            <a
              className="btn btn-primary"
              href="course.html"
              style={{ marginTop: '30px', padding: '15px 30px', fontSize: '14.5px' }}
            >
              강의 자세히 보기 →
            </a>
          </div>
          <div className="prog-visual reveal">
            <svg className="pv-field" viewBox="0 0 320 400">
              <line x1="0" y1="200" x2="320" y2="200" />
              <circle cx="160" cy="200" r="58" />
              <rect x="90" y="0" width="140" height="58" fill="none" />
              <rect x="90" y="342" width="140" height="58" fill="none" />
            </svg>
            <div className="pv-cap">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '18px',
                }}
              >
                <img
                  src={instructorImg}
                  alt="우원재 강사"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    objectPosition: 'center 18%',
                    border: '1px solid var(--line-2)',
                    flex: '0 0 auto',
                  }}
                />
                <div style={{ lineHeight: 1.35 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '16px' }}>
                    우원재
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--paper-dim)' }}>
                    전력분석 강사
                  </div>
                </div>
              </div>
              <div className="wm">
                <b>LEC</b>TURE
              </div>
              <p>
                현장과 데이터를 연결하는 실전형 분석 교육 + 중·고교팀 실습. 7월
                개강.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
