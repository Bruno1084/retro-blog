import { useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useWriteArticle } from "../../hooks/useWriteArticle";
import "@blocknote/mantine/style.css";
import "./WriteArticlePage.css";

export function WriteArticlePage() {
    const [blocks, setBlocks] = useState([]);
    const { publishArticle, loading, error } = useWriteArticle();


    const editor = useCreateBlockNote({
        initialContent: [
            {
                type: "heading",
                props: { level: 1 },
                content: "Título del artículo",
            },
        ],
    });

    const handleChange = () => {
        setBlocks(editor.document);
    };

    const handleSubmit = async () => {
        function extractTitle(blocks) {
            const h1 = blocks.find(
                b => b.type === "heading" && b.props?.level === 1
            );

            return h1
                ? h1.content.map(c => c.text).join("")
                : "Sin título";
        };

        function extractPreview(blocks) {
            const p = blocks.find(b => b.type === "paragraph");
            return p
                ? p.content.map(c => c.text).join("").slice(0, 160)
                : "";
        };

        function slugify(text) {
            return text
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9 ]/g, "")
                .trim()
                .replace(/\s+/g, "-");
        };

        publishArticle({
            title: extractTitle(blocks),
            preview: extractPreview(blocks),
            slug: slugify(extractTitle(blocks)),
            content: blocks,
            author_id: user.id,
            tags: selectedTags,
        });
    };

    return (
        <div className="main--container">
            <div className="blocknote--container">
                <BlockNoteView editor={editor} onChange={handleChange} />

                <div className="btnSubmit--container">
                    <button className="btnSubmit" onClick={handleSubmit}>Enviar</button>
                </div>
            </div>
        </div>
    );
}
