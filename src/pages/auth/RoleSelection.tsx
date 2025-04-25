import { useNavigate } from 'react-router-dom';
import { FaVideo, FaUser } from 'react-icons/fa';

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Choose Your Role
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Select how you want to use Filmila
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Filmmaker Card */}
          <div
            onClick={() => navigate('/register/filmmaker')}
            className="relative group bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                <FaVideo className="h-6 w-6" />
              </div>
              <div className="mt-5 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">As Filmmaker</h3>
                <div className="mt-2 text-sm text-gray-500">
                  Share your films with the world. Upload, manage, and monetize your content.
                </div>
              </div>
            </div>
            <div className="px-4 py-4 sm:px-6 bg-gray-50">
              <div className="text-sm text-center">
                <span className="font-medium text-indigo-600 hover:text-indigo-500">
                  Get started as a filmmaker →
                </span>
              </div>
            </div>
          </div>

          {/* Viewer Card */}
          <div
            onClick={() => navigate('/register/viewer')}
            className="relative group bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white mx-auto">
                <FaUser className="h-6 w-6" />
              </div>
              <div className="mt-5 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">As Viewer</h3>
                <div className="mt-2 text-sm text-gray-500">
                  Discover and watch amazing films. Create playlists and connect with filmmakers.
                </div>
              </div>
            </div>
            <div className="px-4 py-4 sm:px-6 bg-gray-50">
              <div className="text-sm text-center">
                <span className="font-medium text-purple-600 hover:text-purple-500">
                  Start watching now →
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-gray-600 hover:text-gray-500"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
} 