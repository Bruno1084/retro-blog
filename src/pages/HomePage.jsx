import { Article } from "../components/article/Article";
import { Header } from "../components/header/Header";

export function HomePage() {

    return (
        <>
            <Header />

            <main>
                <div id="main--container">
                    <h1>Home Page</h1>
                    <Article
                        id={1}
                        title={"lorem ipsum"}
                        preview={"greglrjigoarjhio jgiroejgi groie jgiro g iejgiro ejgiojgirojeg"}
                        tags={["books", "art", "anime"]}
                        date={"11/03/24"}
                    />
                </div>
            </main>
        </>
    );
}