
import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';

// Admin Pages
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Reels } from './pages/Reels';
import { Services } from './pages/Services';
import { Reviews } from './pages/Reviews';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { Pages } from './pages/Pages';
import { News } from './pages/News';

// Public Website Pages
import { WebsiteLayout } from './pages/website/WebsiteLayout';
import { Home } from './pages/website/Home';
import { PublicProjects } from './pages/website/PublicProjects';
import { PublicProjectDetail } from './pages/website/PublicProjectDetail';
import { PublicReels } from './pages/website/PublicReels';
import { Contact } from './pages/website/Contact';
import { PublicNewsDetail } from './pages/website/PublicNewsDetail';
import { PublicNews } from './pages/website/PublicNews';
import { GetAppointment } from './pages/website/GetAppointment';
import { PublicServices } from './pages/website/PublicServices';

// Integrations
import { ChatWidget } from './components/website/ChatWidget';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-400">Loading Session...</div>;
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Component to force redirect to Home on initial load (Refresh)
// Only affects public website routes, preserves Admin routes.
const RedirectToHomeOnLoad = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the current path is NOT root, NOT login, and NOT admin
    const path = location.pathname;
    const isPublicSubPage = path !== '/' && !path.startsWith('/admin') && !path.startsWith('/login');

    if (isPublicSubPage) {
      // Redirect to home immediately on mount (refresh)
      navigate('/', { replace: true });
    }
  }, []); // Dependency array empty = runs once on mount

  return null;
};

const AppRoutes = () => {
  return (
    <>
      <RedirectToHomeOnLoad />
      <Routes>
        {/* --- PUBLIC WEBSITE ROUTES --- */}
        <Route path="/" element={<WebsiteLayout />}>
          <Route index element={<Home />} />
          <Route path="portfolio" element={<PublicProjects />} />
          <Route path="portfolio/:id" element={<PublicProjectDetail />} />
          <Route path="videos" element={<PublicReels />} />
          <Route path="news" element={<PublicNews />} />
          <Route path="news/:id" element={<PublicNewsDetail />} />
          <Route path="appointment" element={<GetAppointment />} />
          <Route path="contact" element={<Contact />} />
          <Route path="services" element={<PublicServices />} />
        </Route>

        {/* --- ADMIN PANEL ROUTES --- */}
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="reels" element={<Reels />} />
            <Route path="services" element={<Services />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="pages" element={<Pages />} />
            <Route path="news" element={<News />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Catch all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Chat Widget */}
      <ChatWidget />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
