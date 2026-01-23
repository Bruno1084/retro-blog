import "./article.css"

export function Article({ id, title, preview, tags, date }) {

    return (
        <article className="article">
            <a href={`/article/${id}`}>
                <div className="title--container">
                    <h4>{title}</h4>
                </div>
                <div className="preview--container">
                    <p>{preview}</p>
                </div>
                <div className="description--container">
                    <div className="tags--container">
                        {tags.map((value, index) => (
                            <div className="tag-item" key={index}>{value}</div>
                        ))}
                    </div>
                    <div className="date--container">
                        <p>{date}</p>
                    </div>
                </div>
            </a>
        </article>
    );
}