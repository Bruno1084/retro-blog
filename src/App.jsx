import { BrowserRouter, Routes, Route } from 'react-router';
import { HomePage } from './pages/HomePage.jsx';
import { CategoryPage } from './pages/CategoryPage.jsx';
// import { CategoriesPage } from './pages/CategoriesPage.jsx';
import { ArticlePage } from './pages/ArticlePage.jsx';
import { Layout } from './components/layout/Layout.jsx';
import { WriteArticlePage } from './pages/WriteArticlePage.jsx';

function App() {

    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route index path='/' element={<HomePage />} />
                    {/* <Route path='/category' element={<CategoriesPage />} /> */}
                    <Route path='/category/:tag' element={<CategoryPage />} />
                    <Route path='/article/:slug' element={<ArticlePage />} />
                    <Route path='/write-article' element={<WriteArticlePage />} />
                </Routes>
            </Layout>

        </BrowserRouter>
    );
}

export default App
