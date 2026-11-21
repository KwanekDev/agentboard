export default function Nav({ active }: { active?: "board" }) {
  return (
    <header className="nav">
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">Skip to content</a>
        <a className="nav__logo" href="/board"><span className="mark mark--initial" aria-hidden="true">A</span>AgentBoard</a>
        <nav className="nav__links" aria-label="Main">
          <div className="nav__item">
            <a className="nav__link" href="/board" aria-current={active === "board" ? "page" : undefined}>Board </a>
          </div>
        </nav>
        <div className="nav__actions">
          <a className="btn btn--primary" href="/board" aria-current={active === "board" ? "page" : undefined}>Open your board</a>
        </div>
        <button className="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}

