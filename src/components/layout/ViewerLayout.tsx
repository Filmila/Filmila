import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  FilmIcon,
  StarIcon,
  ClockIcon,
  HeartIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface ViewerLayoutProps {
  children: React.ReactNode;
}

const ViewerLayout: React.FC<ViewerLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Home', href: '/viewer/dashboard', icon: HomeIcon },
    { name: 'My Films', href: '/viewer/my-films', icon: FilmIcon },
    { name: 'Continue Watching', href: '/viewer/continue-watching', icon: ClockIcon },
    { name: 'Watchlist', href: '/viewer/watchlist', icon: StarIcon },
    { name: 'Favorites', href: '/viewer/favorites', icon: HeartIcon },
    { name: 'Settings', href: '/viewer/settings', icon: Cog6ToothIcon },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold text-indigo-600">
                  Filmila
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        isActive
                          ? 'border-b-2 border-indigo-500 text-gray-900'
                          : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User Profile Dropdown */}
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-gray-500"
                  >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">About Filmila</h3>
              <p className="text-gray-400">
                Your premier platform for discovering and sharing exceptional films.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
              <div className="space-y-2">
                <p className="text-gray-400">
                  Email: support@filmila.com
                </p>
                <div className="flex space-x-4">
                  <a href="https://twitter.com/filmila" className="text-gray-400 hover:text-white">
                    Twitter
                  </a>
                  <a href="https://instagram.com/filmila" className="text-gray-400 hover:text-white">
                    Instagram
                  </a>
                  <a href="https://facebook.com/filmila" className="text-gray-400 hover:text-white">
                    Facebook
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Filmila. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ViewerLayout; 