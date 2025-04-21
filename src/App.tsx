import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/auth/Login'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './components/admin/AdminLayout'
import FilmsManagement from './pages/admin/FilmsManagement'
import UserManagement from './pages/admin/UserManagement'
import Settings from './pages/admin/Settings'

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
              <Route path="/moderation/settings" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout>
                    <Settings />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute requiredRole="FILMMAKER">
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <h1 className="text-2xl font-bold text-gray-900">Filmmaker Dashboard</h1>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Upload New Film
                      </button>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Total Films</h3>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">2</p>
                        <div className="mt-2">
                          <span className="text-green-600 text-sm">+1 this month</span>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Total Views</h3>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">2,100</p>
                        <div className="mt-2">
                          <span className="text-green-600 text-sm">+500 this week</span>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">$2,100</p>
                        <div className="mt-2">
                          <span className="text-green-600 text-sm">+$500 this week</span>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Approval Rate</h3>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">50%</p>
                        <div className="mt-2">
                          <span className="text-yellow-600 text-sm">2 pending reviews</span>
                        </div>
                      </div>
                    </div>

                    {/* Films List */}
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Your Films</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">The Last Sunset</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,250</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$1,250</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-03-15</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                <button className="text-red-600 hover:text-red-900">Delete</button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">Morning Light</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">850</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$850</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-03-16</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                <button className="text-red-600 hover:text-red-900">Delete</button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                      </div>
                      <div className="p-6">
                        <ul className="space-y-4">
                          <li className="flex items-start">
                            <div className="flex-shrink-0">
                              <span className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                <span className="text-yellow-600">P</span>
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Morning Light</span> is pending review
                              </p>
                              <p className="text-xs text-gray-500">2 days ago</p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <div className="flex-shrink-0">
                              <span className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                <span className="text-yellow-600">P</span>
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">The Last Sunset</span> is pending review
                              </p>
                              <p className="text-xs text-gray-500">3 days ago</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
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