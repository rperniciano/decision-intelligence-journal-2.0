// Test insights API endpoint
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://doqojfsldvajmlscpwhu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function test() {
  // Sign in to get user token
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'session18test@example.com',
    password: 'testpass123'
  });

  if (error) {
    console.error('Login error:', error);
    return;
  }

  const token = data.session.access_token;

  // Test the API endpoint
  const response = await fetch('http://localhost:3003/api/v1/decisions?limit=10', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const result = await response.json();
  console.log('API Response:', JSON.stringify(result, null, 2));
  console.log('\nType of result:', typeof result);
  console.log('Is Array?', Array.isArray(result));
}

test().catch(console.error);
