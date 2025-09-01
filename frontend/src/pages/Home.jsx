import { useRoot } from '@services/RootProvider.jsx'

export default function Home(){
  const { access, tab } = useRoot()  
  return (
    <main className="hero">
      <figure className="cover-wrap">
        <img className="cover-img"
             src="https://m.health.chosun.com/site/data/img_dir/2024/02/29/2024022901209_0.jpg"
             alt="주황빛 오렌지 커버"/>
        <h1 className="hero-title">{access ? '환영합니다! 작업을 시작해볼까요?': '아이디어를 감싸는 색, Orange'}</h1>

        {access && 
          <>
            {/* 하단 대시보드 */}
            <section className="content on-hero">
              {tab==='drawing' ? (
                <section id="tab-drawing" className="panel" role="tabpanel" aria-labelledby="btn-drawing">
                  {/* ✅ 정확 3등분 */}
                  <div className="grid dash-grid equal-3">
                    <button
                      type="button"
                      className="dash-tile tile-button"
                      onClick={()=>alert('데모: 새 캔버스 시작')}
                      aria-label="새 캔버스 시작 열기"
                    >
                      <div className="tile-body">
                        <div className="tile-kicker">START</div>
                        <h4 className="tile-title">새 캔버스 시작</h4>
                        <p className="tile-desc">러프 스케치, 라인아트, 브러시 테스트 등 바로 시작하세요.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="dash-tile tile-button"
                      onClick={()=>alert('데모: 스타일 프리셋')}
                      aria-label="스타일 프리셋 열기"
                    >
                      <div className="tile-body">
                        <div className="tile-kicker">PRESET</div>
                        <h4 className="tile-title">스타일 프리셋</h4>
                        <p className="tile-desc">애니/만화/리얼풍 프리셋으로 빠르게 변환.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="dash-tile tile-button"
                      onClick={()=>alert('데모: 최근 드로잉')}
                      aria-label="최근 드로잉 열기"
                    >
                      <div className="tile-body">
                        <div className="tile-kicker">RECENT</div>
                        <h4 className="tile-title">최근 드로잉</h4>
                        <p className="tile-desc">최근 작업을 이어서 진행할 수 있어요.</p>
                      </div>
                    </button>
                  </div>
                </section>
              ) : (
                <section id="tab-library" className="panel" role="tabpanel" aria-labelledby="btn-library">
                  <div className="grid dash-grid equal-3">
                    <button
                      type="button"
                      className="dash-tile tile-button"
                      onClick={()=>alert('데모: 이미지 갤러리')}
                      aria-label="이미지 갤러리 열기"
                    >
                      <div className="tile-body">
                        <div className="tile-kicker">GALLERY</div>
                        <h4 className="tile-title">이미지 갤러리</h4>
                        <p className="tile-desc">완성작/레퍼런스/임시 저장물 모아보기.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="dash-tile tile-button"
                      onClick={()=>alert('데모: 프로젝트 관리')}
                      aria-label="프로젝트 관리 열기"
                    >
                      <div className="tile-body">
                        <div className="tile-kicker">PROJECT</div>
                        <h4 className="tile-title">프로젝트 관리</h4>
                        <p className="tile-desc">씬/샷/태그로 작품을 체계적으로.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="dash-tile tile-button"
                      onClick={()=>alert('데모: 템플릿 & 프리셋')}
                      aria-label="템플릿 & 프리셋 열기"
                    >
                      <div className="tile-body">
                        <div className="tile-kicker">TEMPLATE</div>
                        <h4 className="tile-title">템플릿 & 프리셋</h4>
                        <p className="tile-desc">반복 작업을 줄여주는 템플릿.</p>
                      </div>
                    
                    </button>
                  </div>
                </section>
              )}
            </section>
          </>
        }

      </figure>

      <footer>© {new Date().getFullYear()} 고담 Team</footer>
    </main>
  );
}
