import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Create Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'filmila-auth-token'
  },
  global: {
    headers: {
      'x-application-name': 'filmila'
    }
  },
  db: {
    schema: 'public'
  }
});

// Add connection health check and session management
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email);
  
  if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing local storage');
    localStorage.clear();
  }
});

// Test the connection immediately
(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Initial auth state:', session ? 'Logged in' : 'Not logged in');
    
    if (session?.user) {
      console.log('Current user:', session.user.email);
    }
  } catch (error) {
    console.error('Error checking auth state:', error);
  }
})();

// Export a function to check connection health
export const checkSupabaseHealth = async () => {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}; 