import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid Supabase URL format. Must start with https://');
}

// Validate key length (basic validation)
if (supabaseAnonKey.length < 20) {
  throw new Error('Invalid Supabase anonymous key format.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: window.localStorage,
  }
});

// Development helper for clearing auth (remove in production)
if (import.meta.env.DEV) {
  (window as typeof window & { clearAuth: () => void }).clearAuth = () => {
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    localStorage.removeItem(`sb-${projectRef}-auth-token`);
    console.log('Auth cleared! Refresh the page.');
  };
}