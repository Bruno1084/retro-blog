import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useArticle(slug) {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) return;

        let isMounted = true;

        const fetchArticle = async () => {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from("articles")
                .select(`
        id,
        slug,
        title,
        preview,
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

            if (!isMounted) return;

            if (error) {
                setError("Artículo no encontrado");
                setLoading(false);
                return;
            }

            setArticle({
                id: data.id,
                slug: data.slug,
                title: data.title,
                preview: data.preview,
                content: data.content,
                date: new Date(data.created_at).toLocaleDateString("es-AR"),
                author: data.authors?.nickname ?? "Anónimo",
                tags: data.articles_tags?.map(at => at.tags.tag) ?? [],
            });

            setLoading(false);
        };

        fetchArticle();

        return () => {
            isMounted = false;
        };
    }, [slug]);


    return { article, loading, error };
}
