import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  role: 'ADMIN' | 'FILMMAKER' | 'VIEWER';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user data on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Temporary user database (replace with real authentication later)
    const users = {
      'at3bk-m@outlook.com': {
        password: '12312311',
        role: 'ADMIN' as const
      },
      'filmmaker@test.com': {
        password: 'filmmaker123',
        role: 'FILMMAKER' as const
      },
      'viewer@test.com': {
        password: 'viewer123',
        role: 'VIEWER' as const
      }
    };

    const userData = users[email as keyof typeof users];
    
    if (userData && userData.password === password) {
      const user = { email, role: userData.role };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 