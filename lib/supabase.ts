
import { createClient } from '@supabase/supabase-js';

// Access Environment Variables safely using Vite's import.meta.env
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Log warning if keys are missing (helpful for debugging)
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase credentials missing! The app will run in Mock Mode.\n' +
        'Check Vercel Settings > Environment Variables.'
    );
}

// Create the client with a fallback to allow the app to initialize even without keys
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        }
    }
);
