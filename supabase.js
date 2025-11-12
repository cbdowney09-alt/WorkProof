// supabase.js
const SUPABASE_URL = 'https://lypnzomzrppvzqiobkcp.supabase.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cG56b216cnBwdnpxaW9ia2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzUxMzAsImV4cCI6MjA3ODU1MTEzMH0.URm48DLZUzxWmAe8n_aHXFjdNZj-z4RWOTSf9G5bnlQ';

// ✅ Ensure window.supabaseJs exists (from the UMD SDK)
const supabase = window.supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it globally available for inline scripts
window.supabase = supabase;

// Export for ES modules
export { supabase };
