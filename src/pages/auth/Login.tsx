import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = Date.now();
    try {
      console.log('Login: Starting login process...', new Date().toISOString());
      
      // Add loading state feedback
      const toastId = toast.loading('Authenticating...', { duration: 15000 });

      // First, try direct authentication with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      console.log('Login: Direct auth response:', {
        success: !!authData?.user,
        error: authError?.message,
        time: Date.now() - startTime + 'ms'
      });

      if (authError) {
        toast.dismiss(toastId);
        console.error('Login failed:', authError);
        toast.error(authError.message || 'Invalid credentials');
        return;
      }

      if (!authData?.user) {
        toast.dismiss(toastId);
        toast.error('No user data received');
        return;
      }

      // Now fetch the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      console.log('Login: Profile fetch result:', {
        hasProfile: !!profile,
        error: profileError?.message,
        time: Date.now() - startTime + 'ms'
      });

      if (profileError) {
        toast.dismiss(toastId);
        console.error('Profile fetch error:', profileError);
        toast.error('Error loading profile. Please try again.');
        return;
      }

      if (!profile) {
        toast.dismiss(toastId);
        toast.error('Profile not found. Please register first.');
        return;
      }

      // Success! Navigate based on role
      toast.dismiss(toastId);
      toast.success('Login successful!');

      const userRole = profile.role.toUpperCase();
      console.log('Login: Navigation with role:', userRole);

      switch(userRole) {
        case 'ADMIN':
          navigate('/admin/films');
          break;
        case 'FILMMAKER':
          navigate('/filmmaker/dashboard');
          break;
        case 'VIEWER':
          navigate('/viewer/dashboard');
          break;
        default:
          toast.error('Invalid user role');
      }

    } catch (error) {
      console.error('Login: Unexpected error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  // Simplify the test sign-in function
  const handleTestSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Test Login Error:', error);
        alert('Login failed: ' + error.message);
        return;
      }

      if (data?.user) {
        console.log('Test Login Success:', {
          id: data.user.id,
          email: data.user.email,
          lastSignIn: data.user.last_sign_in_at
        });
        alert('Login successful! User ID: ' + data.user.id);
      }
    } catch (err) {
      console.error('Test Login Error:', err);
      alert('Unexpected error during test login');
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

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={handleTestSignIn}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Test Sign In Only
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