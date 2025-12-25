
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sxyjupwnoiyopzbotvym.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4eWp1cHdub2l5b3B6Ym90dnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzgyNjcsImV4cCI6MjA4MjIxNDI2N30.rxtErELy09onUL7lzeXZ1JBaH0mTKWVlvb2BsEooJJs';

export const supabase = createClient(supabaseUrl, supabaseKey);
