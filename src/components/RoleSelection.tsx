import React from 'react';

type UserRole = 'FILMMAKER' | 'VIEWER';

interface RoleSelectionProps {
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole) => void;
  onNext: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ selectedRole, setSelectedRole, onNext }) => (
  <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Select your role
      </h2>
    </div>
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 flex flex-col items-center">
        <button
          className={`px-4 py-2 rounded-md mb-4 w-40 ${selectedRole === 'VIEWER' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => { setSelectedRole('VIEWER'); onNext(); }}
        >
          Viewer
        </button>
        <button
          className={`px-4 py-2 rounded-md w-40 ${selectedRole === 'FILMMAKER' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => { setSelectedRole('FILMMAKER'); onNext(); }}
        >
          Filmmaker
        </button>
      </div>
    </div>
  </div>
);

export default RoleSelection; 