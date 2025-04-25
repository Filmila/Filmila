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

  useEffect(() => {
    let mounted = true;

    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await updateUserWithRole(session.user);
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (session?.user && mounted) {
        await updateUserWithRole(session.user);
      }
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting signIn process...');
      setLoading(true);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('AuthContext: Auth error:', authError);
        return { data: null, error: authError };
      }

      if (!authData?.user) {
        console.error('AuthContext: No user data in auth response');
        return { data: null, error: new Error('Authentication failed') };
      }

      // Get or create profile
      const userWithRole = await updateUserWithRole(authData.user);
      return { data: { user: userWithRole }, error: null };

    } catch (error) {
      console.error('AuthContext: Error in signIn:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('An unknown error occurred')
      };
    } finally {
      setLoading(false);
    }
  };

  const updateUserWithRole = async (authUser: User): Promise<CustomUser> => {
    if (!authUser) {
      console.log('updateUserWithRole: No auth user provided');
      setUser(null);
      return authUser as CustomUser;
    }

    try {
      console.log('updateUserWithRole: Fetching role for user:', authUser.id);
      
      // First try to get existing profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (!profileError && profileData) {
        const customUser: CustomUser = {
          ...authUser,
          customRole: profileData.role
        };
        console.log('updateUserWithRole: Found existing profile with role:', profileData.role);
        setUser(customUser);
        return customUser;
      }

      // If no profile exists, create one
      console.log('updateUserWithRole: No profile found, creating new profile');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert([
          {
            id: authUser.id,
            email: authUser.email,
            role: 'VIEWER',
            created_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString()
          }
        ], {
          onConflict: 'id'
        })
        .select('role')
        .single();

      if (createError) {
        console.error('updateUserWithRole: Error creating profile:', createError);
        const defaultUser: CustomUser = {
          ...authUser,
          customRole: 'VIEWER'
        };
        setUser(defaultUser);
        return defaultUser;
      }

      const userWithNewRole: CustomUser = {
        ...authUser,
        customRole: newProfile.role
      };
      console.log('updateUserWithRole: Created new profile with role:', newProfile.role);
      setUser(userWithNewRole);
      return userWithNewRole;

    } catch (error) {
      console.error('updateUserWithRole: Error:', error);
      const defaultUser: CustomUser = {
        ...authUser,
        customRole: 'VIEWER'
      };
      setUser(defaultUser);
      return defaultUser;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (data.user) {
        const customUser = { ...data.user, customRole: 'FILMMAKER' };
        setUser(customUser);
        return { data: { user: customUser }, error };
      }
      
      return { data: null, error };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading,
    isAuthenticated: !!user,
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