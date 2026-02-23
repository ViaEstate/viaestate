import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { LanguageProvider } from "./contexts/LanguageContext"
import ProtectedRoute from "./components/ProtectedRoute"
import ErrorBoundary from "./components/ErrorBoundary"

// Pages
import Index from "./pages/Index"
import Login from "./pages/Login"
import AuthCallback from "./pages/AuthCallback"
import Properties from "./pages/Properties"
import PropertyDetail from "./pages/PropertyDetail"
import ListProperty from "./pages/ListProperty"
import SubmitProperty from "./pages/SubmitProperty"
import PackageBuilder from "./pages/PackageBuilder"
import Dashboard from "./pages/Dashboard"
import EditProperty from "./pages/EditProperty"
import AdminPanel from "./pages/AdminPanel"
import AdminArticles from "./pages/AdminArticles"
import ArticleEditor from "./pages/ArticleEditor"
import Articles from "./pages/Articles"
import ArticleView from "./pages/ArticleView"
import Forum from "./pages/Forum"
import Guidance from "./pages/Guidance"
import AgentPanel from "./pages/AgentPanel"
import AboutUs from "./pages/AboutUs"
import WorkWithUs from "./pages/WorkWithUs"
import NotFound from "./pages/NotFound"
import Navigation from "./components/Navigation"
import { SUPPORTED_LANGUAGES } from "./lib/i18n"

// Language layout wrapper
function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  
  // Validate language
  if (lang && !SUPPORTED_LANGUAGES.includes(lang as any)) {
    return <Navigate to="/en" replace />;
  }
  
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
}

// Redirect root to default language
function RootRedirect() {
  return <Navigate to="/en" replace />;
}

const AppContent = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Language-prefixed routes */}
      <Route path="/:lang" element={<LangLayout />}>
        {/* Public routes */}
        <Route index element={<Index />} />
        <Route path="login" element={<Login />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="properties" element={<ErrorBoundary><Properties /></ErrorBoundary>} />
        <Route path="properties/:id" element={<ErrorBoundary><PropertyDetail /></ErrorBoundary>} />
        <Route path="articles" element={<Articles />} />
        <Route path="articles/:slug" element={<ArticleView />} />
        <Route path="about" element={<AboutUs />} />
        <Route path="forum" element={<Forum />} />
        <Route path="guidance" element={<Guidance />} />
        <Route path="work-with-us" element={<WorkWithUs />} />
        <Route path="packages" element={<Navigate to="/:lang/work-with-us" replace />} />

        {/* Protected routes - any authenticated user */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="panel"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="list-property"
          element={
            <ProtectedRoute>
              <ListProperty />
            </ProtectedRoute>
          }
        />
        <Route
          path="submit-property"
          element={
            <ProtectedRoute>
              <SubmitProperty />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit-property/:id"
          element={
            <ProtectedRoute>
              <EditProperty />
            </ProtectedRoute>
          }
        />
        {/* Role-based protected routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/articles"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminArticles />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/articles/new"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ArticleEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/articles/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ArticleEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="agent-panel"
          element={
            <ProtectedRoute allowedRoles={['broker', 'admin']}>
              <AgentPanel />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 - MUST be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <LanguageProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </LanguageProvider>
  </AuthProvider>
);

export default App
