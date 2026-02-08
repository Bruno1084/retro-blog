import { useState } from "react";
import { supabase } from "../lib/supabase";

export function useWriteArticle() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const publishArticle = async ({
        title,
        preview,
        slug,
        content,
        author_id,
        tags = [],
    }) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        const { data: article, error: articleError } = await supabase
            .from("articles")
            .insert({
                title,
                preview,
                slug,
                content,
                author_id,
                is_active: true,
            })
            .select("id")
            .single();

        if (articleError) {
            setError("Error al publicar el artículo");
            setLoading(false);
            return;
        }

        if (tags.length > 0) {
            const relations = tags.map(tag_id => ({
                article_id: article.id,
                tag_id,
            }));

            const { error: tagsError } = await supabase
                .from("articles_tags")
                .insert(relations);

            if (tagsError) {
                setError("El artículo se guardó, pero fallaron los tags");
            }
        }

        setSuccess(true);
        setLoading(false);
    };

    return { publishArticle, loading, error, success };
}
