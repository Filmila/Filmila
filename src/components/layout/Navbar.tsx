import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import i18n from '../../i18n';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

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
                {t('browse_films')}
              </Link>
              <Link to="/filmmakers" className="text-gray-600 hover:text-purple-600">
                {t('filmmakers')}
              </Link>
              <Link to="/ratings" className="text-gray-600 hover:text-purple-600">
                {t('ratings')}
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-purple-600">
                {t('about')}
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-purple-600">
                {t('contact')}
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
              className="px-2 py-1 rounded text-sm border border-gray-300 hover:bg-gray-100"
              aria-label="Switch language"
            >
              {i18n.language === 'ar' ? 'EN' : 'عربي'}
            </button>
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
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-purple-600"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  {t('signup')}
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