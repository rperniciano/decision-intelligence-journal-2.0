require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'f9-session-test-1768886180148@example.com',
    password: 'TestPassword123!'
  });

  if (data.session) {
    console.log('Access Token Expires At:', new Date((data.session.expires_at || 0) * 1000).toISOString());
    console.log('Refresh Token (first 50 chars):', data.session.refresh_token?.substring(0, 50) + '...');
    console.log('Refresh token type: Opaque (managed by Supabase)');
  } else {
    console.log('Error:', error?.message);
  }
})();
