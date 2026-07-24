import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // Fails loudly at request time rather than silently returning bad data.
  console.warn(
    'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Set them in your .env.local or Vercel project env vars.'
  );
}

// NOTE: this uses the SERVICE ROLE key, which bypasses Row Level Security.
// It must only ever be used in server-side code (API routes), never sent to the browser.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
