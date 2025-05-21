import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // adjust import as needed

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'FILMMAKER'>('VIEWER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Sign up with Supabase Auth
    const { user, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !user) {
      setError(signUpError?.message || 'Signup failed');
      return;
    }

    // Insert into profiles with selected role
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email,
          role, // Insert the selected role
        },
      ]);

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess('Registration successful! Please check your email for confirmation.');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        required
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        required
        onChange={e => setPassword(e.target.value)}
      />

      {/* Role Selection */}
      <div>
        <label>
          <input
            type="radio"
            name="role"
            value="VIEWER"
            checked={role === 'VIEWER'}
            onChange={() => setRole('VIEWER')}
          />
          Viewer
        </label>
        <label>
          <input
            type="radio"
            name="role"
            value="FILMMAKER"
            checked={role === 'FILMMAKER'}
            onChange={() => setRole('FILMMAKER')}
          />
          Filmmaker
        </label>
      </div>

      <button type="submit">Register</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
    </form>
  );
};

export default Register;
