import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lslzfyxiuzrjuharvwmb.supabase.co'
const supabaseAnonKey = 'PASTE_YOUR_ACTUAL_LONG_ANON_KEY_HERE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
