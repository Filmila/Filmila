import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get the user's email from the session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
      } else {
        // If no session, redirect to login
        navigate('/login');
      }
    };

    getSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Verification email sent
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      We've sent a verification email to{' '}
                      <span className="font-medium">{email}</span>.
                      Please check your inbox and click the verification link to complete your registration.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                      >
                        Go to login
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500 text-center">
              <p>
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  try registering again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 