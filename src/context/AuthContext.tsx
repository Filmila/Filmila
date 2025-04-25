import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  role: string;
  created_at?: string;
  last_sign_in_at?: string;
}

interface CustomUser extends User {
  profile?: Profile;
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

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          return;
        }

        if (session?.user && mounted) {
          console.log('Found existing session for user:', session.user.email);
          await updateUserWithProfile(session.user);
        } else {
          console.log('No active session found');
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state');
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (session?.user && mounted) {
        console.log('Session updated, updating user profile');
        await updateUserWithProfile(session.user);
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

  const updateUserWithProfile = async (authUser: User): Promise<CustomUser> => {
    if (!authUser) {
      console.log('updateUserWithProfile: No auth user provided');
      setUser(null);
      return authUser as CustomUser;
    }

    try {
      console.log('Fetching profile for user:', authUser.email);
      
      // Try to get existing profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError.message);
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      if (!profileData) {
        console.log('No profile found for user');
        // Don't create profile here - it should be created during registration
        // or by the database trigger
        const userWithoutProfile: CustomUser = {
          ...authUser,
          profile: undefined
        };
        setUser(userWithoutProfile);
        return userWithoutProfile;
      }

      console.log('Found existing profile:', profileData);
      const userWithProfile: CustomUser = {
        ...authUser,
        profile: profileData
      };
      setUser(userWithProfile);
      return userWithProfile;

    } catch (error) {
      console.error('Error in updateUserWithProfile:', error instanceof Error ? error.message : error);
      const userWithoutProfile: CustomUser = {
        ...authUser,
        profile: undefined
      };
      setUser(userWithoutProfile);
      return userWithoutProfile;
    }
  };

  const signIn = async (email: string, password: string): Promise<{ data: { user: CustomUser } | null; error: Error | null }> => {
    try {
      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { data: null, error: new Error(error.message) };
      }

      if (!data.user) {
        console.error('No user data returned after sign in');
        return { data: null, error: new Error('No user data returned') };
      }

      // Get the user's profile
      const userWithProfile = await updateUserWithProfile(data.user);
      return { data: { user: userWithProfile }, error: null };

    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { data: null, error: error instanceof Error ? error : new Error('An unknown error occurred') };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Starting sign up process for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'VIEWER'
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        return { data: null, error };
      }

      if (!data?.user) {
        console.error('No user data in sign up response');
        return { data: null, error: new Error('Sign up failed') };
      }

      console.log('Sign up successful, creating profile');
      const customUser = await updateUserWithProfile(data.user);
      return { data: { user: customUser }, error: null };
      
    } catch (error) {
      console.error('Unexpected error in signUp:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('An unknown error occurred')
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
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