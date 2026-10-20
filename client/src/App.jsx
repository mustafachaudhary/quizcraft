import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SiteLayout } from './components/Layout.jsx';
import { RequireAuth } from './components/RequireAuth.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { DiscoverPage } from './pages/DiscoverPage.jsx';
import { QuizDetailPage } from './pages/QuizDetailPage.jsx';
import { CreateQuizPage } from './pages/CreateQuizPage.jsx';
import { EditQuizPage } from './pages/EditQuizPage.jsx';
import { TakeQuizPage } from './pages/TakeQuizPage.jsx';
import { ResultsPage } from './pages/ResultsPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function Protected({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="quizzes/:id" element={<QuizDetailPage />} />
            <Route
              path="dashboard"
              element={
                <Protected>
                  <DashboardPage />
                </Protected>
              }
            />
            <Route
              path="history"
              element={
                <Protected>
                  <HistoryPage />
                </Protected>
              }
            />
            <Route
              path="quizzes/new"
              element={
                <Protected>
                  <CreateQuizPage />
                </Protected>
              }
            />
            <Route
              path="quizzes/:id/edit"
              element={
                <Protected>
                  <EditQuizPage />
                </Protected>
              }
            />
            <Route
              path="attempts/:id/results"
              element={
                <Protected>
                  <ResultsPage />
                </Protected>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route
            path="attempts/:id"
            element={
              <Protected>
                <TakeQuizPage />
              </Protected>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
