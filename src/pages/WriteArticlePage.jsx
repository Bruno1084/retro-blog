import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useState } from "react";
import "@blocknote/mantine/style.css";

export function WriteArticlePage() {
    const [blocks, setBlocks] = useState([]);

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

    const handleSubmit = () => {
        console.log("Contenido del artículo:", blocks);
    };

    return (
        <div className="main--container">
            <div className="blocknote--container">
                <BlockNoteView editor={editor} onChange={handleChange} />

                <div>
                    <button onClick={handleSubmit}>Enviar</button>
                </div>
            </div>
        </div>
    );
}
