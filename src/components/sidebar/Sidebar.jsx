import { Link } from "react-router";
import "./sidebar.css";

export function Sidebar({ isOpen, onClose }) {
    return (
        <aside 
            className={`sidebar ${isOpen ? "open" : ""}`}
            onClick={(e) => e.stopPropagation()}
        >
            <nav>
                <ul>
                    <li><Link to="/category/Books" onClick={onClose}>Books</Link></li>
                    <li><Link to="/category/Videogames" onClick={onClose}>Videogames</Link></li>
                    <li><Link to="/category/Music" onClick={onClose}>Music</Link></li>
                    <li><Link to="/category/Anime" onClick={onClose}>Anime</Link></li>
                    <li><Link to="/category/Software" onClick={onClose}>Software</Link></li>
                    <li><Link to="/category/Reflexion" onClick={onClose}>Reflexion</Link></li>
                </ul>
            </nav>
        </aside>
    );
}
