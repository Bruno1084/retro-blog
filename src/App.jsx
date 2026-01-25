import { BrowserRouter, Routes, Route } from 'react-router';
import { HomePage } from './pages/HomePage.jsx';
import { CategoryPage } from './pages/CategoryPage.jsx';
import { ArticlePage } from './pages/ArticlePage.jsx';

function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route index path='/' element={<HomePage />} />
                <Route path='/categories/:tag' element={<CategoryPage />} />
                <Route path='/article/:slug' element={<ArticlePage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
