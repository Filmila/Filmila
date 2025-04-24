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

  // Add test sign-in function
  const testSignIn = async (email: string, password: string) => {
    try {
      console.log('Test Login: Starting simple auth test...');
      console.log('Test Login: Attempting with email:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Test Login: Sign-in failed:', authError.message);
        console.error('Test Login: Full error:', authError);
        alert('Auth error: ' + authError.message);
        return;
      }

      if (!authData?.user) {
        console.error('Test Login: No user returned');
        alert('No user returned');
        return;
      }

      console.log('Test Login: Successful!', {
        id: authData.user.id,
        email: authData.user.email,
        lastSignIn: authData.user.last_sign_in_at
      });
      alert('Login successful! User ID: ' + authData.user.id);
    } catch (err) {
      console.error('Test Login: Unexpected error:', err);
      alert('Unexpected error during test login');
    }
  };

  // Add test handler
  const handleTestSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    await testSignIn(formData.email, formData.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = Date.now();
    try {
      console.log('Login: Starting login process...', new Date().toISOString());
      console.log('Login: Attempting login with:', formData.email);
      
      // Add loading state feedback
      const toastId = toast.loading('Logging in...', { duration: 10000 }); // Set max duration
      
      // Test invalid credentials
      console.log('Login: Sending credentials to AuthContext...');
      const authResult = await Promise.race([
        login(formData.email, formData.password),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout')), 10000)
        )
      ]);
      
      console.log('Login: Auth response time:', Date.now() - startTime, 'ms');

      if (authResult.error) {
        console.error('Login: Failed -', authResult.error.message);
        toast.dismiss(toastId);
        if (authResult.error.message.includes('timeout')) {
          toast.error('Login is taking too long. Please try again.');
        } else {
          toast.error(authResult.error.message || 'Invalid email or password');
        }
        return;
      }

      if (!authResult.data?.user) {
        console.error('Login: No user data received');
        toast.dismiss(toastId);
        toast.error('Login failed. Please try again.');
        return;
      }

      console.log('Login: Success, user data received in:', Date.now() - startTime, 'ms');
      
      // Fetch user profile to get role
      console.log('Login: Fetching profile for user ID:', authResult.data.user.id);
      const profileStartTime = Date.now();
      
      type ProfileResponse = {
        data: { role: string; id: string } | null;
        error: { message?: string; code?: string } | null;
      };

      const profileResult = await Promise.race([
        supabase
          .from('profiles')
          .select('role, id')
          .eq('id', authResult.data.user.id)
          .single(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        )
      ]) as ProfileResponse;

      console.log('Login: Profile fetch time:', Date.now() - profileStartTime, 'ms');

      if (profileResult.error) {
        console.error('Login: Error fetching profile -', profileResult.error);
        toast.dismiss(toastId);
        
        if (profileResult.error.message?.includes('timeout')) {
          toast.error('Profile loading timed out. Please try again.');
        } else if (profileResult.error.code === 'PGRST301') {
          toast.error('Please verify your email first.');
        } else {
          toast.error('Error loading profile. Please try again.');
        }
        return;
      }

      if (!profileResult.data) {
        console.error('Login: No profile data available');
        toast.dismiss(toastId);
        toast.error('Profile not found. Please register first.');
        return;
      }

      console.log('Login: Total process time:', Date.now() - startTime, 'ms');
      
      // Navigate based on role
      const userRole = profileResult.data.role.toUpperCase();
      console.log('Login: Navigating based on role:', userRole);

      toast.dismiss(toastId);
      toast.success('Login successful!');

      // Immediate navigation
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
          toast.error('Invalid user role. Please contact support.');
      }
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('Login: Error after', totalTime, 'ms:', error);
      console.error('Login: Full error object:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        time: totalTime,
        error
      });
      
      toast.dismiss();
      if (error instanceof Error && error.message.includes('timeout')) {
        toast.error('Login process timed out. Please try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
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