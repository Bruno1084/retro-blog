import "./articleFull.css";

export function ArticleFull({ title, preview, tags, date, content }) {

    return (
        <div className="articleFull">
            <div className="title--container">
                <h1>{title}</h1>
            </div>
            <div className="preview--container">
                <p>{preview}</p>
            </div>
            <div className="header--container">
                <div className="author--container">
                    <a href="https://porfolio-bruno.netlify.app/" target="_blank">Bruno</a>
                </div>
                <div className="date--container">
                    <p>{date}</p>
                </div>
            </div>
            <div className="content--container">
                {content.map((block, index) => {
                    switch (block.type) {
                        case "heading":
                            const HeadingTag = `h${block.level || 2}`;

                            return (
                                <div className="content heading--container" key={index}>
                                    <HeadingTag>{block.text}</HeadingTag>
                                </div>
                            );

                        case "paragraph":
                            return (
                                <div className="content paragraph--container" key={index}>
                                    <p>{block.text}</p>
                                </div>
                            );

                        case "image":
                            return (
                                <div className="content image--container" key={index}>
                                    <img src={block.url} alt={block.alt} loading={"lazy"} />
                                </div>
                            );

                        default:
                            return null;
                    }
                })}
            </div>
            <div className="description--container">
                <div className="tags--container">
                    {tags.map((value, index) => (
                        <a href={`/category/${value}`} className="tag-item" key={index}>{value}</a>
                    ))}
                </div>
            </div>
        </div>
    );
}