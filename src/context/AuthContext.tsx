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

      if (error) {
        console.error('fetchUserRole: Error:', error);
        return null;
      }

      console.log('fetchUserRole: Success:', data);
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
      
      // First, just try to authenticate
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login timeout')), 20000);
      });

      const { data: authData, error: authError } = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as any;

      console.log('AuthContext: Auth response:', { authData, authError });

      if (authError) {
        console.error('AuthContext: Auth error:', authError);
        return { data: null, error: authError };
      }

      if (!authData?.user) {
        console.error('AuthContext: No user data in auth response');
        return { data: null, error: new Error('Authentication failed') };
      }

      // Set the user immediately after successful auth
      const initialUser: CustomUser = {
        ...authData.user,
        customRole: 'FILMMAKER' // Set a default role immediately
      };
      setUser(initialUser);

      // Then try to fetch the role asynchronously
      try {
        console.log('AuthContext: Fetching role for user:', authData.user.id);
        const role = await fetchUserRole(authData.user.id);
        
        if (role) {
          const updatedUser: CustomUser = {
            ...authData.user,
            customRole: role
          };
          setUser(updatedUser);
          return { data: { user: updatedUser }, error: null };
        }
        
        // If no role found, create a profile
        console.log('AuthContext: No role found, creating profile...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: authData.user.email,
            role: 'FILMMAKER',
            created_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (profileError) {
          console.error('AuthContext: Error creating profile:', profileError);
          // Still return success since auth worked
          return { data: { user: initialUser }, error: null };
        }

        const userWithNewRole: CustomUser = {
          ...authData.user,
          customRole: profileData.role
        };
        setUser(userWithNewRole);
        return { data: { user: userWithNewRole }, error: null };
      } catch (roleError) {
        console.error('AuthContext: Error handling role:', roleError);
        // Still return success since auth worked
        return { data: { user: initialUser }, error: null };
      }
    } catch (error) {
      console.error('AuthContext: Error in signIn:', error);
      if (error instanceof Error && error.message === 'Login timeout') {
        return { data: null, error: new Error('Login timed out. Please check your internet connection and try again.') };
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