import { Article } from "../components/article/Article";
import { Header } from "../components/header/Header";
import { useArticles } from "../hooks/useArticles";

export function HomePage() {
    const { articles, loading } = useArticles();

    return (
        <>
            <Header />

            <main>
                <div id="main--container">
                    <h1>Home Page</h1>

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
                            tags={article.tags}
                            date={article.created_at}
                        />
                    ))}
                </div>
            </main>
        </>
    );
}