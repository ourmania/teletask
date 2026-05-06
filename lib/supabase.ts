import { createClient } from '@supabase/supabase-js';

let supabaseUrl: string | undefined;
let supabaseAnonKey: string | undefined;

if (typeof process !== 'undefined' && process.env) {
  supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
