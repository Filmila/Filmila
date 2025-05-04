import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user?.profile?.role) return '/';
    const role = user.profile.role.toLowerCase();
    return `/${role}/dashboard`;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-purple-600">
              Filmila
            </Link>
            <div className="hidden md:flex ml-10 space-x-8">
              <Link to="/browse" className="text-gray-600 hover:text-purple-600">
                Browse Films
              </Link>
              <Link to="/filmmakers" className="text-gray-600 hover:text-purple-600">
                Filmmakers
              </Link>
              <Link to="/ratings" className="text-gray-600 hover:text-purple-600">
                Ratings
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-purple-600">
                About
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-purple-600">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={getDashboardLink()}
                  className="text-gray-600 hover:text-purple-600"
                >
                  Dashboard
                </Link>
                <span className="text-sm text-gray-500">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-purple-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 