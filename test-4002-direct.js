const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function test() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data } = await sb.auth.signInWithPassword({
    email: 'feature263@test.com',
    password: 'password123'
  });

  const token = data.session.access_token;

  const response = await fetch('http://localhost:4002/api/v1/pending-reviews', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();

  console.log('Port 4002 Response:');
  console.log('Pending reviews:', result.pendingReviews?.length || 0);
  result.pendingReviews?.forEach(r => console.log('  -', r.decisions?.title));
}

test();
