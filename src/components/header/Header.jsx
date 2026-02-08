import "./header.css";

export function Header({ onToggleSidebar }) {
  return (
    <header>
      <div className="left--container">
        <button
          className="menu-button"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <a href="/" className="brand">
          <span className="name">Bruno's Blog</span>
        </a>
      </div>

      <div className="right--container">
        <a href="/write-article">Write</a>
        <a href="https://porfolio-bruno.netlify.app/" target="blank">About</a>
      </div>
    </header>
  );
}
