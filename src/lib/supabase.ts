import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://giwelvnyuqlfymoqppzn.supabase.co';
// Supabase Dashboard se copy ki gayi Publishable key yahan dalein
const SUPABASE_ANON_KEY = 'sb_publishable_YOUR_KEY_HERE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
