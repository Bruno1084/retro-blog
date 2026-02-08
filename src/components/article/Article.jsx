import { Link } from "react-router";
import "./article.css"

export function Article({ id, slug, title, preview, date }) {

    return (
        <article className="article">
            <Link to={`/article/${slug}`}>
                <div className="title--container">
                    <h4>{title}</h4>
                </div>
                <div className="preview--container">
                    <p>{preview}</p>
                </div>
                <div className="description--container">
                    <div className="date--container">
                        <p>{date}</p>
                    </div>
                </div>
            </Link>
        </article>
    );
}