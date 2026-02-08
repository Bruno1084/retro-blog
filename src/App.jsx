import { BrowserRouter, Routes, Route } from 'react-router';
import { HomePage } from './pages/homePage/HomePage.jsx';
import { CategoryPage } from './pages/categoryPage/CategoryPage.jsx';
import { ArticlePage } from './pages/articlePage/ArticlePage.jsx';
import { Layout } from './components/layout/Layout.jsx';
import { WriteArticlePage } from './pages/writeArticlePage/WriteArticlePage.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx'
import { Login } from './pages/login/Login.jsx';
import { ProtectedRoute } from './auth/ProtectedRoute.jsx';

function App() {

    return (
        <BrowserRouter>
            <AuthProvider>
                <Layout>
                    <Routes>
                        <Route index path='/' element={<HomePage />} />
                        <Route path='/login' element={<Login />} />
                        {/* <Route path='/category' element={<CategoriesPage />} /> */}
                        <Route path='/category/:tag' element={<CategoryPage />} />
                        <Route path='/article/:slug' element={<ArticlePage />} />
                        <Route path='/write-article' element={
                            <ProtectedRoute>
                                <WriteArticlePage />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </Layout>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App
