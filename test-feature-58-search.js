/**
 * Test script for Feature #58: Search returns only matching real data
 * Creates a test user and adds decisions with unique searchable terms
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testFeature58() {
  const timestamp = Date.now();
  const userEmail = `feature58-search-test-${timestamp}@example.com`;
  const userPassword = 'testpass123';

  console.log('=== Feature #58: Search Test Setup ===\n');

  // Step 1: Create test user
  console.log('Step 1: Creating test user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: userEmail,
    password: userPassword,
    options: {
      data: {
        name: 'Feature 58 Search Test User',
      },
    },
  });

  if (signUpError) {
    console.error('❌ Sign up error:', signUpError.message);
    return;
  }

  const userId = signUpData.user.id;
  console.log(`✓ Created user: ${userEmail}`);
  console.log(`  User ID: ${userId}`);

  // Step 2: Sign in to get token
  console.log('\nStep 2: Signing in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: userPassword,
  });

  if (signInError) {
    console.error('❌ Sign in error:', signInError.message);
    return;
  }

  const token = signInData.session.access_token;
  console.log('✓ Signed in successfully');

  // Step 3: Create decision with UNIQUE searchable term
  console.log('\nStep 3: Creating decision with UNIQUE_SEARCHABLE_TERM_XYZ...');
  const uniqueDecision = {
    title: 'UNIQUE_SEARCHABLE_TERM_XYZ - This should match',
    status: 'draft',
    category: 'Testing',
    emotional_state: 'neutral',
    options: [
      {
        title: 'Option 1',
        pros: ['Test pro'],
        cons: ['Test con'],
      },
    ],
    notes: 'This decision contains the unique searchable term UNIQUE_SEARCHABLE_TERM_XYZ',
  };

  let uniqueDecisionId;
  try {
    const response = await fetch('http://localhost:4001/api/v1/decisions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uniqueDecision),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to create unique decision:', error);
      return;
    }

    const data = await response.json();
    uniqueDecisionId = data.id;
    console.log(`✓ Created unique decision: ${uniqueDecisionId}`);
  } catch (error) {
    console.error('❌ Error creating unique decision:', error.message);
    return;
  }

  // Step 4: Create another decision with different title
  console.log('\nStep 4: Creating decision with different title...');
  const otherDecision = {
    title: 'Random Decision About Something Else',
    status: 'draft',
    category: 'Testing',
    emotional_state: 'neutral',
    options: [
      {
        title: 'Option A',
        pros: ['Another pro'],
        cons: ['Another con'],
      },
    ],
    notes: 'This decision does NOT contain the unique searchable term',
  };

  let otherDecisionId;
  try {
    const response = await fetch('http://localhost:4001/api/v1/decisions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(otherDecision),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to create other decision:', error);
      return;
    }

    const data = await response.json();
    otherDecisionId = data.id;
    console.log(`✓ Created other decision: ${otherDecisionId}`);
  } catch (error) {
    console.error('❌ Error creating other decision:', error.message);
    return;
  }

  // Step 5: Test search for UNIQUE_SEARCHABLE_TERM
  console.log('\nStep 5: Testing search for UNIQUE_SEARCHABLE_TERM...');
  try {
    const response = await fetch(`http://localhost:4001/api/v1/decisions?search=UNIQUE_SEARCHABLE_TERM`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Search request failed:', error);
      return;
    }

    const searchResults = await response.json();
    console.log(`✓ Search returned ${searchResults.data?.length || 0} results`);

    if (searchResults.data && searchResults.data.length > 0) {
      console.log('\nSearch results:');
      searchResults.data.forEach((decision, index) => {
        console.log(`  ${index + 1}. ${decision.title}`);
      });

      // Verify: Only the unique decision should appear
      const hasUniqueDecision = searchResults.data.some(d => d.id === uniqueDecisionId);
      const hasOtherDecision = searchResults.data.some(d => d.id === otherDecisionId);

      console.log('\n=== Verification Results ===');
      console.log(`✓ Unique decision found: ${hasUniqueDecision ? 'YES' : 'NO'}`);
      console.log(`✓ Other decision excluded: ${!hasOtherDecision ? 'YES' : 'NO'}`);

      if (hasUniqueDecision && !hasOtherDecision) {
        console.log('\n✅ FEATURE #58: PASSING - Search returns only matching results');
      } else {
        console.log('\n❌ FEATURE #58: FAILING - Search results incorrect');
      }
    } else {
      console.log('\n❌ No search results found - search may not be working');
    }

  } catch (error) {
    console.error('❌ Error performing search:', error.message);
  }

  // Output login credentials for manual testing
  console.log('\n=== Manual Testing Credentials ===');
  console.log(`Email: ${userEmail}`);
  console.log(`Password: ${userPassword}`);
  console.log(`\nSearch term: UNIQUE_SEARCHABLE_TERM_XYZ`);
  console.log(`Should find: "${uniqueDecision.title}"`);
  console.log(`Should NOT find: "${otherDecision.title}"`);
}

testFeature58().catch(console.error);
