import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';

interface CustomUser extends User {
  customRole?: string;
}

interface AuthContextType {
  user: CustomUser | null;
  signUp: (email: string, password: string) => Promise<{
    data: { user: CustomUser } | null;
    error: Error | null;
  }>;
  signIn: (email: string, password: string) => Promise<{
    data: { user: CustomUser } | null;
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<{
    data: { user: CustomUser } | null;
    error: Error | null;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('fetchUserRole: Starting fetch for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      console.log('fetchUserRole: Response:', { data, error });

      if (error) {
        console.error('fetchUserRole: Error fetching user role:', error);
        return null;
      }

      console.log('fetchUserRole: Role found:', data?.role);
      return data?.role || null;
    } catch (error) {
      console.error('fetchUserRole: Error:', error);
      return null;
    }
  };

  const updateUserWithRole = async (authUser: User | null) => {
    if (!authUser) {
      console.log('updateUserWithRole: No auth user provided');
      setUser(null);
      return;
    }

    console.log('updateUserWithRole: Fetching role for user:', authUser.id);
    const role = await fetchUserRole(authUser.id);
    console.log('updateUserWithRole: Fetched role:', role);

    const customUser: CustomUser = {
      ...authUser,
      customRole: role
    };
    console.log('updateUserWithRole: Setting user with role:', customUser);
    setUser(customUser);
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUserWithRole(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await updateUserWithRole(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (data.user) {
        const customUser = { ...data.user };
        await updateUserWithRole(customUser);
        return { data: { user: customUser as CustomUser }, error };
      }
      
      return { data: null, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting signIn process...');
      
      // Add timeout for Supabase call
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login timeout')), 10000);
      });

      // Race between the login and timeout
      const { data, error } = await Promise.race([
        signInPromise,
        timeoutPromise
      ]) as any;

      console.log('AuthContext: Raw Supabase response:', { data, error });
      
      if (error) {
        console.error('AuthContext: Supabase error:', error);
        return { data: null, error };
      }

      if (!data || !data.user) {
        console.error('AuthContext: No data or user in response');
        return { data: null, error: new Error('No user data received') };
      }

      console.log('AuthContext: User authenticated, updating with role...');
      const customUser = { ...data.user };
      
      try {
        await updateUserWithRole(customUser);
        console.log('AuthContext: User updated with role:', customUser);
        return { data: { user: customUser as CustomUser }, error: null };
      } catch (roleError) {
        console.error('AuthContext: Error updating user role:', roleError);
        return { data: null, error: roleError as Error };
      }
    } catch (error) {
      console.error('AuthContext: Error in signIn:', error);
      if (error instanceof Error && error.message === 'Login timeout') {
        return { data: null, error: new Error('Login timed out. Please try again.') };
      }
      return { data: null, error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading,
    isAuthenticated: user !== null,
    logout: signOut,
    login: signIn,
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext; 