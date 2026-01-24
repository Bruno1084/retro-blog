import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useArticles() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from("articles")
                .select(`
          id,
          slug,
          title,
          preview,
          created_at,
          articles_tags (
            tags ( tag )
          )
        `)
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) {
                console.error(error);
                setError("Error cargando artículos");
                setLoading(false);
                return;
            }

            const normalizedArticles = data.map(article => ({
                id: article.id,
                slug: article.slug,
                title: article.title,
                preview: article.preview,
                date: new Date(article.created_at).toLocaleDateString("es-AR"),
                tags: article.articles_tags
                    ? article.articles_tags.map(at => at.tags.tag)
                    : []
            }));

            setArticles(normalizedArticles);
            setLoading(false);
        };

        fetchArticles();
    }, []);

    return { articles, loading, error };
}
