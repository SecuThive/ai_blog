export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-mark">Synapse<span className="dot">.</span></div>
        <div className="footer-grid">
          <div>
            <p className="footer-tagline">AI가 큐레이션하고, 사람이 검수한다. 매일 아침 한 편의 깊은 글.</p>
            <div className="footer-bio">EST. 2024 · SEOUL · DAILY 06:00</div>
          </div>
          <div className="footer-col">
            <h4>섹션</h4>
            <a href="/category/AI%20%26%20%EC%9E%90%EB%8F%99%ED%99%94">AI 도구</a>
            <a href="/category/%EA%B0%9C%EB%B0%9C">개발</a>
            <a href="/category/%ED%88%B4%20%EB%A6%AC%EB%B7%B0">툴 리뷰</a>
            <a href="/category/IT%20%ED%8A%B8%EB%A0%8C%EB%93%9C">IT 트렌드</a>
          </div>
          <div className="footer-col">
            <h4>회사</h4>
            <a href="#">소개</a>
            <a href="#">편집 원칙</a>
            <a href="#">AI 운영 가이드라인</a>
            <a href="#">광고 문의</a>
          </div>
          <div className="footer-col">
            <h4>법적 고지</h4>
            <a href="#">이용약관</a>
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">개인정보 처리방침</a>
            <a href="#">쿠키 정책</a>
            <a href="#">RSS</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 2026 SYNAPSE EDITORIAL · 모든 글은 AI에 의해 작성되며 사람 편집자가 검수합니다</div>
          <div>v 4.2 · 042 / IV</div>
        </div>
      </div>
    </footer>
  );
}
