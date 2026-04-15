import { createClient } from '@supabase/supabase-js'

// Pulling variables from your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// --- DEBUGGING BLOCK ---
// This will help us identify if Vite is actually "seeing" your .env file
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "🚨 VAULTWISE ERROR: Supabase environment variables are missing! " +
    "Check that your .env file is in the root folder and you have restarted the terminal."
  );
}

// Create and export the connection
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-to-prevent-crash.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
