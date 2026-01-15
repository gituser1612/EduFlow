import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://sxyjupwnoiyopzbotvym.supabase.co';
const supabaseAnonKey = 'sb_publishable_1xzzrk6N0hjX6ULSkYA2iw_9m2FQjiQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "eduflow-auth",
    storage: window.localStorage,
  },
});
