import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { User, AuthError } from '@supabase/supabase-js';

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

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          return;
        }

        if (session?.user && mounted) {
          console.log('Found existing session for user:', session.user.email);
          await updateUserWithRole(session.user);
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
        console.log('Session updated, updating user role');
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

  const updateUserWithRole = async (authUser: User): Promise<CustomUser> => {
    if (!authUser) {
      console.log('updateUserWithRole: No auth user provided');
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

      if (profileData) {
        console.log('Found existing profile:', profileData);
        const customUser: CustomUser = {
          ...authUser,
          customRole: profileData.role || 'VIEWER' // Ensure there's always a role
        };
        setUser(customUser);
        return customUser;
      }

      // If no profile exists, create one
      console.log('No profile found, creating new profile');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authUser.id,
            email: authUser.email,
            role: 'VIEWER',
            created_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString()
          }
        ])
        .select('*')
        .single();

      if (createError) {
        console.error('Error creating profile:', createError.message);
        throw new Error(`Failed to create profile: ${createError.message}`);
      }

      if (!newProfile) {
        throw new Error('Profile creation succeeded but no profile was returned');
      }

      console.log('Created new profile:', newProfile);
      const userWithNewRole: CustomUser = {
        ...authUser,
        customRole: newProfile.role || 'VIEWER' // Ensure there's always a role
      };
      setUser(userWithNewRole);
      return userWithNewRole;

    } catch (error) {
      console.error('Error in updateUserWithRole:', error instanceof Error ? error.message : error);
      // Set a default role if profile creation fails
      const defaultUser: CustomUser = {
        ...authUser,
        customRole: 'VIEWER'
      };
      setUser(defaultUser);
      return defaultUser;
    }
  };

  const signIn = async (email: string, password: string): Promise<{ data: { user: CustomUser } | null; error: Error | null }> => {
    try {
      // Clear any existing session first
      await supabase.auth.signOut();
      
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

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Don't fail the sign in if profile fetch fails
        return { data: { user: data.user as CustomUser }, error: null };
      }

      // Create custom user with role
      const customUser: CustomUser = {
        ...data.user,
        customRole: profileData?.role
      };

      return { data: { user: customUser }, error: null };
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
      const customUser = await updateUserWithRole(data.user);
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