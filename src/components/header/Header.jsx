import './header.css';

export function Header() {

    return (
        <>
            <header>
                <div className="left--container">
                    <a href='#' className='brand'>
                        <img src="#" alt="logo" />
                        <span className='name'>Wind's Blog</span>
                    </a>
                </div>
                <div className='right--container'>
                    <a href="#">About</a>
                </div>
            </header>
            <div className='sidebar'>
                <nav>
                    <ul>
                        <li>
                            <a href="">Buscar</a>
                        </li>
                        <li>
                            <a href="">Buscar</a>
                        </li>
                        <li>
                            <a href="">Buscar</a>
                        </li>
                        <li>
                            <a href="">Buscar</a>
                        </li>
                        <li>
                            <a href="">Buscar</a>
                        </li>
                        <li>
                            <a href="">Buscar</a>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    );
}