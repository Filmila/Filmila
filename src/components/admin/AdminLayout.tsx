import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  FilmIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  ShieldCheckIcon, 
  ChartBarIcon, 
  CogIcon 
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const navigation = [
  { name: 'Films', href: '/moderation/films', icon: FilmIcon },
  { name: 'Users', href: '/moderation/users', icon: UsersIcon },
  { name: 'Revenue', href: '/moderation/revenue', icon: CurrencyDollarIcon },
  { name: 'Moderation', href: '/moderation/approvals', icon: ShieldCheckIcon },
  { name: 'Analytics', href: '/moderation/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/moderation/settings', icon: CogIcon },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 bg-indigo-600">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="w-8 h-8 rounded-full"
                  src="https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff"
                  alt="Admin"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Admin</p>
                <p className="text-xs text-gray-500">at3bk-m@outlook.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 