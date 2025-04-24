import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'FILMMAKER' | 'VIEWER';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    console.log('ProtectedRoute mount check:', {
      isAuthenticated,
      userRole: user?.role,
      requiredRole,
      user
    });
  }, [isAuthenticated, user, requiredRole]);

  if (!isAuthenticated || !user) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.toUpperCase();
  const requiredRoleUpper = requiredRole?.toUpperCase();

  console.log('Role check:', {
    userRole,
    requiredRoleUpper,
    match: userRole === requiredRoleUpper
  });

  if (requiredRoleUpper && userRole !== requiredRoleUpper) {
    console.log('Role mismatch, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Route-specific redirects
  if (userRole === 'FILMMAKER' && window.location.pathname === '/') {
    console.log('Filmmaker at root, redirecting to dashboard');
    return <Navigate to="/filmmaker/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 