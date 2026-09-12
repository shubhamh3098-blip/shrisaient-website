import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://giwelvnyuqlfymoqppzn.supabase.co/rest/v1/';
// Supabase Dashboard se copy ki gayi Publishable key yahan dalein
const SUPABASE_ANON_KEY = 'sb_publishable_p5ZXWfakQwN-iQRG6uKHSQ_nq-LcpgE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
