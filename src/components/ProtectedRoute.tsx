import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'FILMMAKER' | 'VIEWER';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  console.log('ProtectedRoute check:', {
    isAuthenticated,
    userRole: user?.role,
    requiredRole,
    user
  });

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role?.toUpperCase() !== requiredRole?.toUpperCase()) {
    console.log('Role mismatch:', {
      userRole: user?.role?.toUpperCase(),
      requiredRole: requiredRole?.toUpperCase()
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 