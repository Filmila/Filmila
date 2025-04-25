import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../config/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading('Signing in...');
    
    try {
      console.log('Starting authentication process...');
      
      // Step 1: Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('Authentication failed:', authError);
        toast.dismiss(loadingToast);
        toast.error(authError.message || 'Invalid credentials');
        return;
      }

      if (!authData?.user) {
        console.error('No user data received after authentication');
        toast.dismiss(loadingToast);
        toast.error('Authentication failed. Please try again.');
        return;
      }

      console.log('Authentication successful. User ID:', authData.user.id);

      // Step 2: Get or create user profile
      let attempts = 0;
      const maxAttempts = 3;
      let userProfile = null;

      while (attempts < maxAttempts && !userProfile) {
        attempts++;
        console.log(`Attempt ${attempts} to get/create profile...`);

        try {
          // First, try to get existing profile
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (!profileError && existingProfile) {
            console.log('Existing profile found:', existingProfile);
            userProfile = existingProfile;
            break;
          }

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Unexpected error fetching profile:', profileError);
            continue;
          }

          // Profile doesn't exist, create one
          console.log('Creating new profile for user:', authData.user.id);
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: authData.user.id,
                email: authData.user.email,
                role: 'VIEWER',
                created_at: new Date().toISOString(),
                last_sign_in_at: new Date().toISOString()
              }
            ], {
              onConflict: 'id'
            })
            .select()
            .single();

          if (createError) {
            console.error(`Failed to create profile (attempt ${attempts}):`, createError);
            if (attempts === maxAttempts) {
              throw createError;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            continue;
          }

          console.log('Successfully created new profile:', newProfile);
          userProfile = newProfile;
          break;
        } catch (error) {
          console.error(`Error in attempt ${attempts}:`, error);
          if (attempts === maxAttempts) {
            throw error;
          }
        }
      }

      if (!userProfile) {
        throw new Error('Failed to get or create user profile after multiple attempts');
      }

      // Update last sign in time
      console.log('Updating last sign in time...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Failed to update last sign in time:', updateError);
        // Non-critical error, don't throw
      }

      // Step 3: Navigate based on role
      console.log('Navigating based on role:', userProfile.role);
      toast.dismiss(loadingToast);
      toast.success('Login successful! Redirecting...');

      const userRole = userProfile.role.toUpperCase();
      switch (userRole) {
        case 'ADMIN':
          navigate('/admin/films');
          break;
        case 'FILMMAKER':
          navigate('/filmmaker/dashboard');
          break;
        case 'VIEWER':
        default:
          navigate('/viewer/dashboard');
          break;
      }

    } catch (error) {
      console.error('Unexpected error during login:', error);
      toast.dismiss(loadingToast);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
                autoComplete="current-password"
                required
                disabled={isLoading}
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Don't have an account? Register
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