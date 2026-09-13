import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tktwsjaviwljdztcxdvj.supabase.co';
const supabaseKey = 'sb_publishable_2FX72056JxkJIDZFCbFiJQ_hVXppFo2';

export const supabase = createClient(supabaseUrl, supabaseKey);
