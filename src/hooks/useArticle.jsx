import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useArticle(slug) {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) return;

        const fetchArticle = async () => {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from("articles")
                .select(`
                    id,
                    slug,
                    title,
                    content,
                    created_at,
                    authors ( nickname ),
                    articles_tags (
                        tags ( tag )
                    )
                `)
                .eq("slug", slug)
                .eq("is_active", true)
                .single();

            if (error) {
                console.error(error);
                setError("Artículo no encontrado");
                setLoading(false);
                return;
            }

            const normalizedArticle = {
                id: data.id,
                slug: data.slug,
                title: data.title,
                content: data.content,
                date: new Date(data.created_at).toLocaleDateString("es-AR"),
                author: data.authors?.nickname ?? "Anónimo",
                tags: data.articles_tags
                    ? data.articles_tags.map(at => at.tags.tag)
                    : []
            };

            setArticle(normalizedArticle);
            setLoading(false);
        };

        fetchArticle();
    }, [slug]);

    return { article, loading, error };
}
