const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkEmptyDecisions() {
  // Sign in as the test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'session24test@example.com',
    password: 'testpass123'
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  console.log('Logged in as:', authData.user.email);

  // Fetch decisions
  const { data: decisions, error: decisionsError } = await supabase
    .from('decisions')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (decisionsError) {
    console.error('Error fetching decisions:', decisionsError);
    return;
  }

  console.log('Number of decisions:', decisions.length);
  console.log('Decisions data:', JSON.stringify(decisions, null, 2));

  if (decisions.length === 0) {
    console.log('✅ VERIFIED: Empty state is real - no decisions exist in database');
  } else {
    console.log('❌ WARNING: Found decisions when expecting empty state');
  }

  await supabase.auth.signOut();
}

checkEmptyDecisions();
