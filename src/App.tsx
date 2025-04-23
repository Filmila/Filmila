import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TestConnection from './pages/TestConnection';
import FilmmakerDashboard from './pages/filmmaker/FilmmakerDashboard';
import UploadFilm from './pages/filmmaker/UploadFilm';
import FilmsManagement from './pages/admin/FilmsManagement';
import Settings from './pages/admin/Settings';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/test-connection" element={<TestConnection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout>
                <Routes>
                  <Route path="films" element={<FilmsManagement />} />
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

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 