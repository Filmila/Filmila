import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'VIEWER' as 'ADMIN' | 'FILMMAKER' | 'VIEWER',
    portfolioLink: '',
    filmGenre: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDebugInfo('Starting registration...');
    const loadingToast = toast.loading('Creating your account...');

    try {
      // Log the attempt
      console.log('Registration attempt with:', { 
        email: formData.email, 
        role: formData.role,
        passwordLength: formData.password.length 
      });

      // Validate email format with a more permissive regex
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        const msg = 'Please enter a valid email address (e.g., user@gmail.com)';
        console.log('Email validation failed:', msg);
        toast.error(msg, { duration: 5000 });
        setDebugInfo('Email validation failed');
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        const msg = 'Password must be at least 6 characters long';
        console.log('Password validation failed:', msg);
        toast.error(msg);
        setDebugInfo('Password validation failed');
        return;
      }

      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        const msg = 'Passwords do not match';
        console.log('Password match validation failed');
        toast.error(msg);
        setDebugInfo('Passwords do not match');
        return;
      }

      setDebugInfo('Calling Supabase auth.signUp...');
      console.log('Starting Supabase registration...');

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: formData.role
          }
        }
      });

      if (authError) {
        console.error('Registration error:', authError);
        toast.dismiss(loadingToast);
        toast.error(authError.message);
        setDebugInfo(`Auth error: ${authError.message}`);
        return;
      }

      if (!authData?.user) {
        const msg = 'No user data received from registration';
        console.error(msg);
        toast.dismiss(loadingToast);
        toast.error(msg);
        setDebugInfo(msg);
        return;
      }

      // Create user profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            role: formData.role,
            portfolio_link: formData.role === 'FILMMAKER' ? formData.portfolioLink : null,
            film_genre: formData.role === 'FILMMAKER' ? formData.filmGenre : null,
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast.dismiss(loadingToast);
        toast.error('Failed to create user profile');
        setDebugInfo(`Profile error: ${profileError.message}`);
        return;
      }

      console.log('Registration successful');
      setDebugInfo('Registration successful!');

      // Show success message
      toast.dismiss(loadingToast);
      toast.success(
        'Registration successful! Please check your email to verify your account before logging in.',
        { duration: 6000 }
      );

      // Clear form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'VIEWER',
        portfolioLink: '',
        filmGenre: ''
      });

      // Sign out the user to ensure they verify their email
      await supabase.auth.signOut();

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.dismiss(loadingToast);
      toast.error('An unexpected error occurred');
      setDebugInfo(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            Create your account
          </h2>
          {debugInfo && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {debugInfo}
            </p>
          )}
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
                disabled={isLoading}
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
                autoComplete="new-password"
                required
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="role" className="sr-only">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="VIEWER">Viewer</option>
                <option value="FILMMAKER">Filmmaker</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
              </span>
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Already have an account? Sign in
            </a>
            <div className="mt-2">
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