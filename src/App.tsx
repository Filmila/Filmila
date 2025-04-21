import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/auth/Login'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './components/admin/AdminLayout'
import FilmsManagement from './pages/admin/FilmsManagement'
import UserManagement from './pages/admin/UserManagement'

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'ADMIN' | 'FILMMAKER' | 'VIEWER' }> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-indigo-600">
                  Filmila
                </Link>
                <Link
                  to="/login"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </nav>
          </header>

          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/moderation" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout>
                    <div className="bg-white shadow rounded-lg p-6">
                      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
                      <p className="text-gray-600">Welcome to the moderation panel</p>
                    </div>
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/moderation/films" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout>
                    <FilmsManagement />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/moderation/users" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout>
                    <UserManagement />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute requiredRole="FILMMAKER">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h1 className="text-2xl font-bold mb-4">Filmmaker Dashboard</h1>
                    <p className="text-gray-600">Welcome to your filmmaker dashboard</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/browse" element={
                <ProtectedRoute>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h1 className="text-2xl font-bold mb-4">Browse Films</h1>
                    <p className="text-gray-600">Discover amazing short films</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/" element={
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Welcome to Filmila
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    Your platform for discovering and sharing amazing short films
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-2">Watch</h3>
                      <p className="text-gray-600">
                        Discover and watch amazing short films from talented filmmakers
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-2">Share</h3>
                      <p className="text-gray-600">
                        Upload and share your films with a global audience
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-2">Earn</h3>
                      <p className="text-gray-600">
                        Monetize your content and grow your filmmaker career
                      </p>
                    </div>
                  </div>
                </div>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App 