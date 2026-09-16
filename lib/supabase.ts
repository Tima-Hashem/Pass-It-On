/**
 * Supabase Client Initialization
 * 
 * Configures the Supabase client using environment variables.
 * Safe fallback strings are provided to prevent runtime exceptions when
 * external Supabase credentials have not been configured yet in the environment.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
