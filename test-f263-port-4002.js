// Quick test on port 4002
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickTest() {
  console.log('Testing API on port 4002...\n');

  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email: 'feature263@test.com',
    password: 'password123',
  });
  const accessToken = sessionData.session.access_token;

  const response = await fetch('http://localhost:4002/api/v1/pending-reviews', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();

  console.log('Pending reviews:', data.pendingReviews?.length || 0);
  data.pendingReviews?.forEach(r => {
    console.log('  -', r.decisions?.title);
  });

  console.log('\nExpected (currently IN quiet hours 18:00-19:00):');
  console.log('  → TEST_263_VISIBLE_ALWAYS: SHOW');
  console.log('  → TEST_263_HIDDEN_DURING_QUIET: HIDE');

  if (data.pendingReviews?.length === 1) {
    console.log('\n✓✓✓ FILTERING WORKING! ✓✓✓');
  } else {
    console.log('\n✗✗✗ FILTERING NOT WORKING ✗✗✗');
  }
}

quickTest();
