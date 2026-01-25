import "./articleFull.css";

export function ArticleFull({ title, preview, tags, date, content }) {

    return (
        <div className="articleFull">
            <div className="title--container">
                <h1>{title}</h1>
            </div>
            <div className="preview--container">
                <h4>{preview}</h4>
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
            <div className="content--container">
                {content.map((block, index) => {
                    switch (block.type) {
                        case "heading":
                            return (
                                <div className="heading--container" key={index}>
                                    <h3>{block.text}</h3>
                                </div>
                            );

                        case "paragraph":
                            return (
                                <div className="paragraph--container" key={index}>
                                    <p>{block.text}</p>
                                </div>
                            );

                        case "image":
                            return (
                                <div className="image--container" key={index}>
                                    <img src={block.url} alt={block.alt} loading={"lazy"} />
                                </div>
                            );

                        default:
                            return null;
                    }
                })}
            </div>
        </div>
    );
}