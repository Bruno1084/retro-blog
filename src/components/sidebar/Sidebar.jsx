import { Link } from "react-router";

export function Sidebar({ isOpen, onClose }) {
    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>
            <nav>
                <ul>
                    <li><Link to="/category/books" onClick={onClose}>Books</Link></li>
                    <li><Link to="/category/videogames" onClick={onClose}>Videogames</Link></li>
                    <li><Link to="/category/music" onClick={onClose}>Music</Link></li>
                    <li><Link to="/category/anime" onClick={onClose}>Anime</Link></li>
                    <li><Link to="/category/software" onClick={onClose}>Software</Link></li>
                    <li><Link to="/category/meditations" onClick={onClose}>Meditations</Link></li>
                </ul>
            </nav>
        </aside>
    );
}
