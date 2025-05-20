import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  isProfileLoading?: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  signUp: (email: string, password: string, role: 'VIEWER' | 'FILMMAKER') => Promise<{
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
  const profileFetchInProgress = useRef<boolean>(false);
  const lastAuthEvent = useRef<string | null>(null);

  // Function to update user state immediately without profile
  const setUserWithoutProfile = (authUser: User | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    
    const userWithoutProfile: CustomUser = {
      ...authUser,
      profile: undefined,
      isProfileLoading: true
    };
    setUser(userWithoutProfile);
    return userWithoutProfile;
  };

  // Function to start profile fetch in background
  const startProfileFetch = async (authUser: User) => {
    // Prevent multiple concurrent profile fetches
    if (profileFetchInProgress.current) {
      console.log('Profile fetch already in progress, skipping');
      return;
    }

    try {
      profileFetchInProgress.current = true;
      console.log('Starting background profile fetch for:', authUser.email);
      
      const profileData = await fetchProfileWithTimeout(authUser);

      if (!profileData) {
        console.log('No profile found, creating default profile in background');
        const defaultProfile = await createDefaultProfile(authUser, 'VIEWER');
        if (defaultProfile) {
          setUser(current => current ? { ...current, profile: defaultProfile, isProfileLoading: false } : null);
          return;
        }
      } else {
        console.log('Profile fetched successfully:', profileData);
        setUser(current => current ? { ...current, profile: profileData, isProfileLoading: false } : null);
        return;
      }

      // If we get here, no profile was created or fetched
      setUser(current => current ? { ...current, isProfileLoading: false } : null);
      
    } catch (error) {
      console.error('Background profile fetch failed:', error);
      setUser(current => current ? { ...current, isProfileLoading: false } : null);
    } finally {
      profileFetchInProgress.current = false;
    }
  };

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
          setUserWithoutProfile(session.user);
          startProfileFetch(session.user);
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
      // Prevent handling duplicate events
      if (event === lastAuthEvent.current) {
        console.log('Ignoring duplicate auth event:', event);
        return;
      }
      lastAuthEvent.current = event;
      
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state');
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Only handle specific auth events
      if (['SIGNED_IN', 'USER_UPDATED', 'INITIAL_SESSION'].includes(event) && session?.user && mounted) {
        console.log('Valid auth event, setting user without profile:', event);
        setUserWithoutProfile(session.user);
        
        // Only fetch profile for SIGNED_IN or if we don't have a profile yet
        if (event === 'SIGNED_IN' || !user?.profile) {
          startProfileFetch(session.user);
        }
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

  const createDefaultProfile = async (authUser: User, role: 'VIEWER' | 'FILMMAKER'): Promise<Profile | null> => {
    try {
      const defaultProfile = {
        id: authUser.id,
        email: authUser.email!,
        role,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([defaultProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating default profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createDefaultProfile:', error);
      return null;
    }
  };

  const fetchProfileWithTimeout = async (authUser: User, timeoutMs: number = 5000): Promise<Profile | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeoutId);

      if (error) {
        if (error.message.includes('abort')) {
          console.log('Profile fetch timed out');
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string): Promise<{ data: { user: CustomUser } | null; error: Error | null }> => {
    try {
      setLoading(true);
      
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

      // Set user immediately without profile
      const userWithoutProfile = setUserWithoutProfile(data.user);
      
      // Start profile fetch in background
      startProfileFetch(data.user);

      return { data: { user: userWithoutProfile! }, error: null };

    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { data: null, error: error instanceof Error ? error : new Error('An unknown error occurred') };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: 'VIEWER' | 'FILMMAKER') => {
    try {
      console.log('Starting sign up process for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { role }
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

      console.log('Sign up successful, setting initial user state');
      const userWithoutProfile = setUserWithoutProfile(data.user);
      await createDefaultProfile(data.user, role);
      startProfileFetch(data.user);
      return { data: { user: userWithoutProfile! }, error: null };
      
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