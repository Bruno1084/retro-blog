import { useCategory } from "../hooks/useCategory";
import { Article } from "../components/article/Article";
import { useParams } from "react-router";

export function CategoryPage() {
    const { tag } = useParams();
    const { articles, loading } = useCategory(tag);

    return (
        <>
            <main>
                <div className="main--container">
                    <div className="categoryFull">
                        <div className="title--container">
                            <h1>{tag}</h1>
                        </div>
                        <div className="description--container">
                            <div className="published--container">
                                <p>{articles.published}</p>
                            </div>
                        </div>
                        <div className="content--container">
                            {loading && <p>Cargando artículos...</p>}

                            {!loading && articles.length === 0 && (
                                <p>No hay artículos publicados</p>
                            )}

                            {!loading && articles.map(article => (
                                <Article
                                    key={article.id}
                                    slug={article.slug}
                                    title={article.title}
                                    preview={article.preview}
                                    date={article.created_at}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}