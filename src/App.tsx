import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import RegisterFlow from './pages/RegisterFlow';
import TestConnection from './pages/TestConnection';
import FilmmakerDashboard from './pages/filmmaker/FilmmakerDashboard';
import UploadFilm from './pages/filmmaker/UploadFilm';
import FilmsManagement from './pages/admin/FilmsManagement';
import UserManagement from './pages/admin/UserManagement';
import AdminSettings from './pages/admin/Settings';
import AdminLayout from './components/layout/AdminLayout';
import ViewerLayout from './components/layout/ViewerLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import ViewerDashboard from './pages/viewer/ViewerDashboard';
import ViewerSettings from './pages/viewer/ViewerSettings';
import MyFilms from './pages/viewer/MyFilms';
import ContinueWatching from './pages/viewer/ContinueWatching';
import Watchlist from './pages/viewer/Watchlist';
import Favorites from './pages/viewer/Favorites';
import Contact from './pages/Contact';
import About from './pages/About';
import WatchFilm from './pages/WatchFilm';
import Settings from './pages/filmmaker/Settings';
import FilmmakerLayout from './components/layout/FilmmakerLayout';
import BrowseFilms from './pages/BrowseFilms';

function AppRoutes() {
  const location = useLocation();
  // Hide Navbar on dashboard routes
  const hideNavbar = location.pathname.startsWith('/filmmaker') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/viewer');

  return (
    <>
      <Toaster />
      {!hideNavbar && <Navbar />}
      <main className="min-h-screen bg-gray-50 pt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterFlow />} />
          <Route path="/test-connection" element={<TestConnection />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout>
                <Routes>
                  <Route path="films" element={<FilmsManagement />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route index element={<Navigate to="films" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Filmmaker Routes */}
          <Route path="/filmmaker/*" element={
            <ProtectedRoute requiredRole="FILMMAKER">
              <FilmmakerLayout>
                <Routes>
                  <Route path="dashboard" element={<FilmmakerDashboard />} />
                  <Route path="films" element={<MyFilms />} />
                  <Route path="upload" element={<UploadFilm />} />
                  <Route path="settings" element={<Settings />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Routes>
              </FilmmakerLayout>
            </ProtectedRoute>
          } />

          {/* Viewer Routes */}
          <Route path="/viewer/*" element={
            <ProtectedRoute requiredRole="VIEWER">
              <ViewerLayout>
                <Routes>
                  <Route path="dashboard" element={<ViewerDashboard />} />
                  <Route path="my-films" element={<MyFilms />} />
                  <Route path="continue-watching" element={<ContinueWatching />} />
                  <Route path="watchlist" element={<Watchlist />} />
                  <Route path="favorites" element={<Favorites />} />
                  <Route path="settings" element={<ViewerSettings />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ViewerLayout>
            </ProtectedRoute>
          } />

          {/* Watch Film Route */}
          <Route path="/watch/:id" element={<WatchFilm />} />

          {/* Browse Films Route */}
          <Route path="/browse" element={<BrowseFilms />} />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App; 