import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/theme.css';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background-secondary to-background-primary">
      <nav className="nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold gradient-text">Filmila</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                Home
              </Link>
              {user ? (
                <>
                  <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                    Dashboard
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="btn btn-secondary"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="nav mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h3 className="text-xl font-bold gradient-text mb-2">Filmila</h3>
              <p className="text-secondary text-sm">
                Your premier platform for independent filmmakers
              </p>
            </div>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6">
              <Link to="/about" className="nav-link">
                About Us
              </Link>
              <Link to="/contact" className="nav-link">
                Contact
              </Link>
              <Link to="/privacy" className="nav-link">
                Privacy Policy
              </Link>
              <Link to="/terms" className="nav-link">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center text-secondary text-sm">
            © {new Date().getFullYear()} Filmila. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 