import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://edhcmlyfjcqtmzzmzmbd.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkaGNtbHlmamNxdG16em16bWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTQ5NzAsImV4cCI6MjA5MjU5MDk3MH0.Og4Ib_Lw4IunuZSZNPbkh3ojeLebeFeRDZi8EIBWlz0';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
