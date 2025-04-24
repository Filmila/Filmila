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
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        updateUserWithRole(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await updateUserWithRole(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting signIn process...');
      
      // First, try to authenticate
      const authResult = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initial auth timeout')), 30000)
        )
      ]) as any;

      console.log('AuthContext: Initial auth response:', authResult);

      if (authResult.error) {
        console.error('AuthContext: Auth error:', authResult.error);
        return { data: null, error: authResult.error };
      }

      if (!authResult.data?.user) {
        console.error('AuthContext: No user data in auth response');
        return { data: null, error: new Error('Authentication failed') };
      }

      // Set the user immediately after successful auth
      const initialUser: CustomUser = {
        ...authResult.data.user,
        customRole: 'FILMMAKER' // Set a default role immediately
      };
      setUser(initialUser);

      // Then try to fetch the role asynchronously
      try {
        // Wait for any pending token refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('AuthContext: Fetching role for user:', authResult.data.user.id);
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          console.error('AuthContext: No session after auth');
          return { data: { user: initialUser }, error: null };
        }

        // Try to fetch the role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authResult.data.user.id)
          .single();

        if (profileError) {
          console.log('AuthContext: No existing profile, creating one...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: authResult.data.user.id,
              email: authResult.data.user.email,
              role: 'FILMMAKER',
              created_at: new Date().toISOString(),
              last_sign_in_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (createError) {
            console.error('AuthContext: Error creating profile:', createError);
            return { data: { user: initialUser }, error: null };
          }

          const userWithNewRole: CustomUser = {
            ...authResult.data.user,
            customRole: newProfile.role
          };
          setUser(userWithNewRole);
          return { data: { user: userWithNewRole }, error: null };
        }

        const userWithRole: CustomUser = {
          ...authResult.data.user,
          customRole: profileData.role
        };
        setUser(userWithRole);
        return { data: { user: userWithRole }, error: null };

      } catch (roleError) {
        console.error('AuthContext: Error handling role:', roleError);
        // Still return success since auth worked
        return { data: { user: initialUser }, error: null };
      }
    } catch (error) {
      console.error('AuthContext: Error in signIn:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        return { 
          data: null, 
          error: new Error('Connection is slow. Please check your internet connection and try again.') 
        };
      }
      return { data: null, error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
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
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUserWithRole = async (authUser: User | null) => {
    if (!authUser) {
      console.log('updateUserWithRole: No auth user provided');
      setUser(null);
      return;
    }

    try {
      console.log('updateUserWithRole: Fetching role for user:', authUser.id);
      
      // Wait for any pending token refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error('updateUserWithRole: No valid session');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('updateUserWithRole: Error fetching role:', error);
        // Set default role if fetch fails
        const defaultUser: CustomUser = {
          ...authUser,
          customRole: 'FILMMAKER'
        };
        setUser(defaultUser);
        return;
      }

      const customUser: CustomUser = {
        ...authUser,
        customRole: data.role
      };
      console.log('updateUserWithRole: Setting user with role:', customUser);
      setUser(customUser);
    } catch (error) {
      console.error('updateUserWithRole: Error:', error);
      // Set default role if there's an error
      const defaultUser: CustomUser = {
        ...authUser,
        customRole: 'FILMMAKER'
      };
      setUser(defaultUser);
    }
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