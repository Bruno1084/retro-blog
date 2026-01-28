import { Link } from "react-router";

export function Sidebar({ isOpen, onClose }) {
    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>
            <nav>
                <ul>
                    <li><Link to="/category/Books" onClick={onClose}>Books</Link></li>
                    <li><Link to="/category/Videogames" onClick={onClose}>Videogames</Link></li>
                    <li><Link to="/category/Music" onClick={onClose}>Music</Link></li>
                    <li><Link to="/category/Anime" onClick={onClose}>Anime</Link></li>
                    <li><Link to="/category/Software" onClick={onClose}>Software</Link></li>
                    <li><Link to="/category/Meditations" onClick={onClose}>Meditations</Link></li>
                </ul>
            </nav>
        </aside>
    );
}
