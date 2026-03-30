import { createClient } from '@supabase/supabase-js';

const getEnvValue = (...values: Array<string | undefined>) => values.find((value) => value && value.trim().length > 0);

const supabaseUrl = getEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
const supabaseKey = getEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, process.env.SUPABASE_SERVICE_KEY);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
