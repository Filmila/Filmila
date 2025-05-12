import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  FilmIcon,
  PlusCircleIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../config/supabase';

interface FilmmakerLayoutProps {
  children: React.ReactNode;
}

const FilmmakerLayout: React.FC<FilmmakerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/filmmaker/dashboard', icon: HomeIcon },
    { name: 'My Films', href: '/filmmaker/films', icon: FilmIcon },
    { name: 'Upload Film', href: '/filmmaker/upload', icon: PlusCircleIcon },
    { name: 'Settings', href: '/filmmaker/settings', icon: Cog6ToothIcon },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
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
            {/* Back and Logout Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Back
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default FilmmakerLayout; 