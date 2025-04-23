import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'VIEWER' as 'ADMIN' | 'FILMMAKER' | 'VIEWER'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDebugInfo('Starting registration...');

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
        setIsLoading(false);
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        const msg = 'Password must be at least 6 characters long';
        console.log('Password validation failed:', msg);
        toast.error(msg);
        setDebugInfo('Password validation failed');
        setIsLoading(false);
        return;
      }

      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        const msg = 'Passwords do not match';
        console.log('Password match validation failed');
        toast.error(msg);
        setDebugInfo('Passwords do not match');
        setIsLoading(false);
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

      console.log('Supabase auth response:', {
        user: authData?.user ? 'User created' : 'No user created',
        error: authError ? authError.message : 'No error',
        session: authData?.session ? 'Session created' : 'No session',
        fullError: authError
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        setDebugInfo(`Auth error: ${authError.message || JSON.stringify(authError)}`);
        throw authError;
      }

      if (!authData.user) {
        const msg = 'No user data received from registration';
        console.error(msg);
        setDebugInfo(msg);
        throw new Error(msg);
      }

      setDebugInfo('Creating user profile...');
      console.log('Creating user profile for:', authData.user.id);

      // Create profile with role
      console.log('Creating profile with role:', formData.role);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            role: formData.role,
            email: formData.email,
            display_name: formData.email.split('@')[0],
            phone: null,
            providers: [],
            provider_type: 'email',
            created_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString()
          }
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setDebugInfo(`Profile error: ${profileError.message || JSON.stringify(profileError)}`);
        throw profileError;
      }

      console.log('Profile created successfully with role:', formData.role);

      console.log('Registration completed successfully');
      setDebugInfo('Registration successful!');

      // Show success message
      toast.success(
        'Registration successful! You can now log in.',
        { duration: 5000 }
      );

      // Clear form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'VIEWER'
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error: any) {
      console.error('Registration error:', error);
      setDebugInfo(`Error: ${error.message || JSON.stringify(error) || 'Unknown error occurred'}`);
      
      if (error.message?.includes('User already registered')) {
        toast.error('This email is already registered. Please try logging in instead.');
      } else if (error.message?.includes('Password should be at least')) {
        toast.error('Password must be at least 6 characters long');
      } else if (error.message?.includes('rate limit')) {
        toast.error('Too many attempts. Please try again later.');
      } else if (error.message?.includes('valid email')) {
        toast.error('Please use a valid email address (e.g., user@gmail.com)', { duration: 5000 });
      } else {
        toast.error(
          error.message || 'Registration failed. Please try again.',
          { duration: 4000 }
        );
      }
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
          <p className="mt-2 text-center text-sm text-gray-600">
            Please use a valid email address (e.g., name@gmail.com)
          </p>
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
                placeholder="Email address (e.g., name@gmail.com)"
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
                minLength={6}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (min 6 characters)"
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
                minLength={6}
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>

          {debugInfo && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              Status: {debugInfo}
            </div>
          )}

          <div className="text-center">
            <a
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
} 