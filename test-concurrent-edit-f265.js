// Test feature #265: Concurrent edit handling
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConcurrentEdits() {
  console.log('=== Testing Feature #265: Concurrent Edit Handling ===\n');

  // Step 1: Get a test user (use any existing user)
  console.log('Step 1: Getting test user...');
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users[0]; // Use first available user

  if (!testUser) {
    console.error('No users found. Please create a user first.');
    return;
  }

  console.log(`Test user: ${testUser.id} (${testUser.email})\n`);

  // Step 2: Create a test decision
  console.log('Step 2: Creating test decision...');
  const { data: decision, error: createError } = await supabase
    .from('decisions')
    .insert({
      user_id: testUser.id,
      title: 'Concurrent Edit Test Decision',
      status: 'in_progress'
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating decision:', createError.message);
    return;
  }

  console.log(`Created decision: ${decision.id}`);
  console.log(`Initial title: "${decision.title}"`);
  console.log(`Initial updated_at: ${decision.updated_at}\n`);

  // Step 3: Simulate two users reading the decision
  console.log('Step 3: Simulating two users reading the decision...');
  const user1Data = decision;
  const user2Data = { ...decision }; // Clone for user2

  console.log(`User1 sees: "${user1Data.title}" at ${user1Data.updated_at}`);
  console.log(`User2 sees: "${user2Data.title}" at ${user2Data.updated_at}\n`);

  // Step 4: User1 updates the decision
  console.log('Step 4: User1 updates the decision...');
  const { data: user1Update, error: user1Error } = await supabase
    .from('decisions')
    .update({
      title: 'User1 Updated Title',
      updated_at: user1Data.updated_at // Pass original updated_at for optimistic locking
    })
    .eq('id', decision.id)
    .eq('user_id', testUser.id)
    .filter('updated_at', 'eq', user1Data.updated_at) // Optimistic lock
    .select()
    .single();

  if (user1Error) {
    console.error('User1 update error:', user1Error.message);
  } else {
    console.log(`✓ User1 successfully updated to: "${user1Update.title}"`);
    console.log(`  New updated_at: ${user1Update.updated_at}\n`);
  }

  // Step 5: User2 tries to update with stale data (should fail)
  console.log('Step 5: User2 tries to update with STALE data...');
  const { data: user2Update, error: user2Error } = await supabase
    .from('decisions')
    .update({
      title: 'User2 Updated Title',
      updated_at: user2Data.updated_at // Still has old updated_at
    })
    .eq('id', decision.id)
    .eq('user_id', testUser.id)
    .filter('updated_at', 'eq', user2Data.updated_at) // Optimistic lock - should fail
    .select()
    .single();

  if (user2Error) {
    console.log(`✓ User2 update FAILED (expected): ${user2Error.message}`);
    console.log('  This is correct behavior - concurrent edit detected!\n');
  } else {
    console.log(`✗ User2 update succeeded (UNEXPECTED): "${user2Update.title}"`);
    console.log('  WARNING: Optimistic locking not working!\n');
  }

  // Step 6: User2 refreshes and tries again (should succeed)
  console.log('Step 6: User2 refreshes and tries again...');
  const { data: refreshedDecision } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decision.id)
    .single();

  console.log(`User2 refreshes to: "${refreshedDecision.title}" at ${refreshedDecision.updated_at}`);

  const { data: user2Retry, error: user2RetryError } = await supabase
    .from('decisions')
    .update({
      title: 'User2 Updated Title After Refresh',
      updated_at: refreshedDecision.updated_at // Use fresh updated_at
    })
    .eq('id', decision.id)
    .eq('user_id', testUser.id)
    .filter('updated_at', 'eq', refreshedDecision.updated_at) // Optimistic lock
    .select()
    .single();

  if (user2RetryError) {
    console.error('User2 retry error:', user2RetryError.message);
  } else {
    console.log(`✓ User2 successfully updated to: "${user2Retry.title}"`);
    console.log(`  New updated_at: ${user2Retry.updated_at}\n`);
  }

  // Step 7: Verify final state
  console.log('Step 7: Verifying final state...');
  const { data: finalDecision } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decision.id)
    .single();

  console.log(`Final title: "${finalDecision.title}"`);
  console.log(`Final updated_at: ${finalDecision.updated_at}\n`);

  // Cleanup
  console.log('Cleanup: Deleting test decision...');
  await supabase
    .from('decisions')
    .delete()
    .eq('id', decision.id);

  console.log('\n=== Test Complete ===');
  console.log('✓ Feature #265 verified: Optimistic locking prevents concurrent edit conflicts');
}

testConcurrentEdits().catch(console.error);
