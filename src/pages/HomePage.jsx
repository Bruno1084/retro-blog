import { Article } from "../components/article/Article";
import { useArticles } from "../hooks/useArticles";
import { useState } from "react";

export function HomePage() {
    const { articles, loading } = useArticles();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <>
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