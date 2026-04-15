import { createClient } from '@supabase/supabase-js'

/**
 * Vaultwise Connection Engine
 * --------------------------
 * Pulls credentials from Vercel (Production) or .env (Local)
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// --- PRE-FLIGHT DIAGNOSTIC ---
// If you see a black screen, press F12 and check the Console for these messages.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ VAULTWISE AUTH ALERT: API Keys are missing. " +
    "Local: Check your .env file. " +
    "Live: Check Vercel Environment Variables."
  );
} else {
  console.log("✅ Vaultwise Engine: Neural Link Established.");
}

// Initialize the client with fallbacks to prevent the "Invalid URL" crash
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
