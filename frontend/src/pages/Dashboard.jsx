// /src/pages/Dashboard.jsx
import { useState } from 'react';
import UserInfoModal from '@/components/UserInfoModal';

export default function Dashboard(){
  const [tab, setTab] = useState('drawing');           // 'drawing' | 'library'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUser, setShowUser] = useState(false);

  return (
    <main className="hero dashboard">
      {/* 좌상단 사이드바 토글 (고정) */}
      <button
        id="menuToggle"
        className="menu-toggle burger"
        aria-label="사이드바 열기/닫기"
        aria-expanded={sidebarOpen}
        onClick={()=>setSidebarOpen(v=>!v)}
        style={{position:'fixed', left:16, top:16, zIndex:1060}}
      >
        <span></span><span></span><span></span>
      </button>

      {/* 슬라이드 사이드바 (항상 렌더, class로 열림/닫힘 제어) */}
      <aside
        className={`sidebar floating slide ${sidebarOpen ? 'is-open' : ''}`}
        aria-label="작업 사이드바"
        aria-hidden={!sidebarOpen}
      >
        <div className="tabs" role="tablist" aria-label="Main Tabs">
          <button
            className={`btn btn-tab ${tab==='drawing' ? 'is-active' : ''}`}
            onClick={()=>setTab('drawing')}
            id="btn-drawing"
          >🎨 드로잉</button>
          <button
            className={`btn btn-tab ${tab==='library' ? 'is-active' : ''}`}
            onClick={()=>setTab('library')}
            id="btn-library"
          >📁 라이브러리</button>
        </div>
      </aside>

      {/* 오버레이 (열렸을 때만) */}
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="사이드바 닫기"
          onClick={()=>setSidebarOpen(false)}
        />
      )}

      <figure className="cover-wrap">
        <img
          className="cover-img"
          src="https://m.health.chosun.com/site/data/img_dir/2024/02/29/2024022901209_0.jpg"
          alt="오렌지 톤의 커버 이미지"
        />
        <h1 className="hero-title">환영합니다! 작업을 시작해볼까요?</h1>

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
      </figure>

      {/* 회원 정보 버튼(좌하단 고정) */}
      <button
        className="btn btn-login"
        style={{position:'fixed', left:16, bottom:16, zIndex:1060}}
        onClick={()=>setShowUser(true)}
        aria-label="회원 정보 열기"
      >
        회원 정보
      </button>

      <UserInfoModal show={showUser} onHide={()=>setShowUser(false)} />
      <footer>© {new Date().getFullYear()} Orange Team</footer>
    </main>
  );
}
