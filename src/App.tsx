import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/auth/Login'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './components/admin/AdminLayout'
import FilmsManagement from './pages/admin/FilmsManagement'
import UserManagement from './pages/admin/UserManagement'
import Settings from './pages/admin/Settings'
import UploadFilm from './pages/filmmaker/UploadFilm'
import Home from './pages/Home'
import TestConnection from './pages/TestConnection'
import FilmmakerDashboard from './pages/filmmaker/FilmmakerDashboard'

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'ADMIN' | 'FILMMAKER' | 'VIEWER' }> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/test-connection" element={<TestConnection />} />
          <Route path="/login" element={<Login />} />
          
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

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App 