import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
}

export const supabase = createBrowserClient(
  supabaseUrl || '',
  supabaseKey || '',
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      detectSessionInUrl: true,
    }
  }
);