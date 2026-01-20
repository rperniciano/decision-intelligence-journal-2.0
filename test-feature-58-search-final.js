/**
 * Final test for Feature #58: Search returns only matching real data
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSearchFeature() {
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
  const token = signInData.session.access_token;

  console.log('=== Feature #58: Search Test ===\n');
  console.log('User ID:', userId);
  console.log('');

  // Step 1: Get all decisions (baseline)
  console.log('Step 1: Get all decisions (baseline)');
  const response1 = await fetch('http://localhost:4001/api/v1/decisions', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data1 = await response1.json();
  console.log(`✓ Total decisions: ${data1.decisions?.length || 0}`);
  data1.decisions?.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.title}`);
  });

  // Step 2: Search for UNIQUE_SEARCHABLE_TERM
  console.log('\nStep 2: Search for "UNIQUE_SEARCHABLE_TERM"');
  const response2 = await fetch('http://localhost:4001/api/v1/decisions?search=UNIQUE_SEARCHABLE_TERM', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data2 = await response2.json();
  console.log(`✓ Search results: ${data2.decisions?.length || 0}`);
  data2.decisions?.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.title}`);
  });

  // Step 3: Verify results
  console.log('\n=== Verification ===');

  const uniqueDecision = data1.decisions?.find(d =>
    d.title.includes('UNIQUE_SEARCHABLE_TERM_XYZ')
  );
  const otherDecision = data1.decisions?.find(d =>
    d.title.includes('Random Decision')
  );

  const searchResults = data2.decisions || [];
  const hasUniqueDecision = searchResults.some(d => d.id === uniqueDecision?.id);
  const hasOtherDecision = searchResults.some(d => d.id === otherDecision?.id);

  console.log(`✓ Unique decision exists in DB: ${uniqueDecision ? 'YES' : 'NO'}`);
  console.log(`✓ Other decision exists in DB: ${otherDecision ? 'YES' : 'NO'}`);
  console.log(`✓ Search found unique decision: ${hasUniqueDecision ? 'YES' : 'NO'}`);
  console.log(`✓ Search excluded other decision: ${!hasOtherDecision ? 'YES' : 'NO'}`);

  console.log('\n=== Test Result ===');

  if (
    uniqueDecision &&
    otherDecision &&
    hasUniqueDecision &&
    !hasOtherDecision &&
    searchResults.length === 1
  ) {
    console.log('✅ FEATURE #58: PASSING');
    console.log('   Search returns only matching real data');
    console.log('   - Matching decision found: YES');
    console.log('   - Non-matching decision excluded: YES');
    console.log('   - Results count correct: YES (1 result)');
  } else {
    console.log('❌ FEATURE #58: FAILING');
    console.log('   Expected: Search returns only the matching decision');
    console.log('   Actual:');
    console.log(`   - Unique decision in DB: ${uniqueDecision ? 'YES' : 'NO'}`);
    console.log(`   - Other decision in DB: ${otherDecision ? 'YES' : 'NO'}`);
    console.log(`   - Search found unique: ${hasUniqueDecision ? 'YES' : 'NO'}`);
    console.log(`   - Search found other: ${hasOtherDecision ? 'YES' : 'NO'}`);
    console.log(`   - Search results count: ${searchResults.length}`);
  }
}

testSearchFeature().catch(console.error);
