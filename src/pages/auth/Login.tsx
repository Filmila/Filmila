import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Login: Attempting login with:', formData.email);
      const success = await login(formData.email, formData.password);
      
      if (success) {
        console.log('Login: Success, showing toast');
        toast.success('Login successful!');
        
        // Get fresh user data
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Login: User data after login:', userData);

        // Navigate based on role
        const userRole = userData.role?.toUpperCase();
        console.log('Login: User role for navigation:', userRole);

        // Small delay to ensure auth context is updated
        setTimeout(() => {
          if (userRole === 'ADMIN') {
            console.log('Login: Navigating to admin dashboard');
            navigate('/admin/films');
          } else if (userRole === 'FILMMAKER') {
            console.log('Login: Navigating to filmmaker dashboard');
            navigate('/filmmaker/dashboard');
          } else {
            console.log('Login: Navigating to browse');
            navigate('/browse');
          }
        }, 100);
      } else {
        console.log('Login: Failed - Invalid credentials');
        toast.error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login: Error during login:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>

          <div className="text-center space-y-4">
            <a
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Don't have an account? Register
            </a>
            <div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                Back to Homepage
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 