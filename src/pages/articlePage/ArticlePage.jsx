import { useParams } from "react-router";
import { useArticle } from "../../hooks/useArticle";
import { ArticleFull } from "../../components/articleFull/articleFull";
import "./articlePage.css";

export function ArticlePage() {
    const { slug } = useParams();
    const { article, loading } = useArticle(slug);

    return (
        <>
            <div className="main--container">

                {loading && <p className="p-details">Cargando artículos...</p>}

                {!loading && article.length === 0 && (
                    <p className="p-details">No hay artículos publicados</p>
                )}

                {!loading && <ArticleFull
                    key={article.id}
                    title={article.title}
                    preview={article.preview}
                    tags={article.tags}
                    date={article.date}
                    content={article.content}
                />}
            </div>
        </>
    );
}