/**
 * Verify that decisions were created for Feature #58 test
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyDecisions() {
  const userEmail = 'feature58-search-test-1768892898086@example.com';
  const userPassword = 'testpass123';

  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: userPassword,
  });

  if (signInError) {
    console.error('❌ Sign in error:', signInError.message);
    return;
  }

  const userId = signInData.user.id;
  console.log('✓ Logged in as user:', userId);

  // Check all decisions
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('❌ Error fetching decisions:', error.message);
    return;
  }

  console.log(`\n✓ Found ${decisions.length} decisions:\n`);
  decisions.forEach((d, i) => {
    console.log(`${i + 1}. ID: ${d.id}`);
    console.log(`   Title: ${d.title}`);
    console.log(`   Status: ${d.status}`);
    console.log(`   Category: ${d.category}`);
    console.log(`   Created: ${d.created_at}`);
    console.log('');
  });

  // Now test search via API
  const token = signInData.session.access_token;
  console.log('\n--- Testing API Search ---\n');

  // Test 1: Search without query (should return all)
  console.log('Test 1: Get all decisions (no search query)...');
  const response1 = await fetch('http://localhost:4001/api/v1/decisions', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data1 = await response1.json();
  console.log(`✓ Returned ${data1.data?.length || 0} decisions`);

  // Test 2: Search with query
  console.log('\nTest 2: Search for UNIQUE_SEARCHABLE_TERM...');
  const response2 = await fetch('http://localhost:4001/api/v1/decisions?search=UNIQUE_SEARCHABLE_TERM', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  console.log(`Response status: ${response2.status}`);
  const data2 = await response2.json();
  console.log(`✓ Returned ${data2.data?.length || 0} decisions`);

  if (data2.data && data2.data.length > 0) {
    data2.data.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.title}`);
    });
  }

  // Test 3: Check if search endpoint exists
  console.log('\nTest 3: Checking search endpoint implementation...');
  const response3 = await fetch('http://localhost:4001/api/v1/decisions/search?q=test', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  console.log(`Search endpoint status: ${response3.status}`);
  if (response3.status === 404) {
    console.log('ℹ️  /api/v1/decisions/search endpoint does not exist');
    console.log('ℹ️  Search might be implemented as a query parameter on /decisions');
  } else if (response3.status === 200) {
    console.log('✓ /api/v1/decisions/search endpoint exists');
    const data3 = await response3.json();
    console.log(`  Returned ${data3.data?.length || 0} results`);
  }
}

verifyDecisions().catch(console.error);
