import { useParams } from "react-router";
import { Header } from "../components/header/Header";

export function ArticlePage () {
    const { id } = useParams();

    return (
        <>
            <Header />

            <main>
                <div id="main--container">

                </div>
            </main>
        
        </>
    );
}