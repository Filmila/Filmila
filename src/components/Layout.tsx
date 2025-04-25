import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/theme.css';

const Layout = () => {
  const { user, logout } = useAuth();

  const getDashboardLink = () => {
    if (!user?.customRole) return '/';
    const role = user.customRole.toLowerCase();
    return `/${role}/${role === 'admin' ? 'films' : 'dashboard'}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold font-montserrat">
            Filmila
          </Link>
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  to={getDashboardLink()} 
                  className="hover:text-gray-300 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="hover:text-gray-300 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="hover:text-gray-300 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">About Filmila</h3>
              <p className="text-gray-400">
                Your premier platform for discovering and sharing exceptional short films.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/browse" className="text-gray-400 hover:text-white transition-colors">
                    Browse Films
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <p className="text-gray-400">
                Email: support@filmila.com<br />
                Follow us on social media
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Filmila. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 