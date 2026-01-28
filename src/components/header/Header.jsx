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
          <span className="name">Wind's Blog</span>
        </a>
      </div>

      <div className="right--container">
        <a href="#">About</a>
      </div>
    </header>
  );
}
