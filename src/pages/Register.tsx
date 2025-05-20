import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

type UserRole = 'FILMMAKER' | 'VIEWER';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  portfolioLink?: string;
  filmGenre?: string;
  displayName?: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('VIEWER');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    portfolioLink: '',
    filmGenre: '',
    displayName: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (selectedRole === 'FILMMAKER') {
      if (!formData.portfolioLink || !formData.filmGenre) {
        setError('Portfolio link and film genre are required for filmmakers');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Get the authenticated user
        const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
        if (authUserError || !authUserData?.user) {
          setError('Could not get authenticated user after sign up.');
          setLoading(false);
          return;
        }

        const userId = authUserData.user.id;
        const userEmail = authUserData.user.email;

        // Insert into profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: userEmail,
              role: selectedRole, // FILMMAKER or VIEWER
              created_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.error('Profile creation failed:', profileError);
          setError('Profile creation failed: ' + profileError.message);
          setLoading(false);
          return;
        }

        // Redirect after successful registration
        if (selectedRole === 'FILMMAKER') {
          navigate('/filmmaker/dashboard');
        } else {
          navigate('/viewer/dashboard');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <div className="text-center mb-4">Select your role:</div>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => handleRoleSelect('VIEWER')}
                className={`px-4 py-2 rounded-md ${
                  selectedRole === 'VIEWER'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Viewer
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('FILMMAKER')}
                className={`px-4 py-2 rounded-md ${
                  selectedRole === 'FILMMAKER'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Filmmaker
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {selectedRole === 'FILMMAKER' && (
              <>
                <div>
                  <label htmlFor="portfolioLink" className="block text-sm font-medium text-gray-700">
                    Portfolio Link
                  </label>
                  <div className="mt-1">
                    <input
                      id="portfolioLink"
                      name="portfolioLink"
                      type="url"
                      value={formData.portfolioLink}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="filmGenre" className="block text-sm font-medium text-gray-700">
                    Primary Film Genre
                  </label>
                  <div className="mt-1">
                    <input
                      id="filmGenre"
                      name="filmGenre"
                      type="text"
                      value={formData.filmGenre}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 