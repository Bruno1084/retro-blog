import { useParams } from "react-router";
import { useArticle } from "../hooks/useArticle";
import { Header } from "../components/header/Header";
import { ArticleFull } from "../components/articleFull/articleFull";

export function ArticlePage() {
    const { slug } = useParams();
    const { article, loading } = useArticle(slug);

    return (
        <>
            <Header />

            <main>
                <div id="main--container">

                    {loading && <p>Cargando artículos...</p>}

                    {!loading && article.length === 0 && (
                        <p>No hay artículos publicados</p>
                    )}

                    {!loading && <ArticleFull
                        key={article.id}
                        title={article.title}
                        preview={article.preview}
                        tags={article.tags}
                        date={article.created_at}
                        content={article.content}
                    />}

                </div>
            </main>

        </>
    );
}