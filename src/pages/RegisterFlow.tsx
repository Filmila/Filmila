import { useState } from 'react';
import RoleSelection from '../components/RoleSelection';
import RegistrationForm from './Register';

type UserRole = 'FILMMAKER' | 'VIEWER';

const RegisterFlow = () => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  return (
    <>
      {step === 1 && (
        <RoleSelection
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && selectedRole && (
        <RegistrationForm selectedRole={selectedRole} />
      )}
    </>
  );
};

export default RegisterFlow; 