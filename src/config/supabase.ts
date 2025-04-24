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
    storageKey: 'filmila-auth-token',
    debug: true
  },
  global: {
    headers: {
      'x-application-name': 'filmila'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Add connection health check and session management
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event);
  
  if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing local storage');
    localStorage.clear();
  }
  
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.email);
  }
});

// Test connection and verify auth is working
(async () => {
  try {
    // Test basic connection
    const { error } = await supabase.from('profiles').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('Supabase connection successful');

    // Test auth is initialized
    const { data: authData } = await supabase.auth.getSession();
    console.log('Auth initialized:', authData.session ? 'With session' : 'No session');
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Supabase initialization error:', errorMessage);
    // Don't throw, just log the error
  }
})();

// Export a function to check connection health
export const checkSupabaseHealth = async () => {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact' });
    return !error;
  } catch {
    return false;
  }
}; 