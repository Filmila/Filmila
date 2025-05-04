import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RoleSelection from './pages/auth/RoleSelection';
import TestConnection from './pages/TestConnection';
import FilmmakerDashboard from './pages/filmmaker/FilmmakerDashboard';
import UploadFilm from './pages/filmmaker/UploadFilm';
import FilmsManagement from './pages/admin/FilmsManagement';
import UserManagement from './pages/admin/UserManagement';
import Settings from './pages/admin/Settings';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster />
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RoleSelection />} />
            <Route path="/register/filmmaker" element={<Register defaultRole="FILMMAKER" />} />
            <Route path="/register/viewer" element={<Register defaultRole="VIEWER" />} />
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
                    <Route path="settings" element={<Settings />} />
                    <Route index element={<Navigate to="films" replace />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Filmmaker Routes */}
            <Route path="/filmmaker/*" element={
              <ProtectedRoute requiredRole="FILMMAKER">
                <Routes>
                  <Route path="dashboard" element={<FilmmakerDashboard />} />
                  <Route path="upload" element={<UploadFilm />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Routes>
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

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App; 