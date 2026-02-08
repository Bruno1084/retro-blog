import { useState, useEffect } from "react";
import { Header } from "../header/Header";
import { Sidebar } from "../sidebar/Sidebar";
import "./Layout.css";

export function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = isSidebarOpen ? "hidden" : "auto";
    }, [isSidebarOpen]);

    return (
        <>
            <Header onToggleSidebar={() => setIsSidebarOpen(v => !v)} />

            {isSidebarOpen && (
                <div
                    className="overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className={isSidebarOpen ? "shifted" : ""}>
                {children}
            </main>
        </>
    );
}
