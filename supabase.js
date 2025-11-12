// ===============================================
// WorkProof Supabase Client
// ===============================================
// This file centralizes your Supabase connection.
// Import this in your app (index.html or app.js)
// instead of hardcoding keys inline.
//
// Example:
//   import { supabase } from './supabase.js';
// ===============================================

// ✅ Replace with your own Supabase credentials
const SUPABASE_URL = 'https://lypnzomzrppvzqiobkcp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cG56b216cnBwdnpxaW9ia2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzUxMzAsImV4cCI6MjA3ODU1MTEzMH0.URm48DLZUzxWmAe8n_aHXFjdNZj-z4RWOTSf9G5bnlQ';

// Initialize Supabase client (v2)
const supabase = window.supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Optional: expose globally if you're using <script> tags instead of imports
window.supabase = supabase;

// Export for ES module imports
export { supabase };
