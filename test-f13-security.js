// Test script for Feature #13: Cannot access another user's decision by ID manipulation
// This script creates two test users and a decision for User A

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTestUsers() {
  console.log('Setting up test users for Feature #13 security test...\n');

  // Get or create User A
  let userIdA;
  const { data: existingUsersA } = await supabase.auth.admin.listUsers();
  const userA = existingUsersA.users.find(u => u.email === 'feature13_user_a@test.com');

  if (userA) {
    console.log('✓ User A exists:', userA.id);
    userIdA = userA.id;
  } else {
    const { data: newUserA } = await supabase.auth.admin.createUser({
      email: 'feature13_user_a@test.com',
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: { name: 'Feature 13 User A' }
    });
    console.log('✓ Created User A:', newUserA.user.id);
    userIdA = newUserA.user.id;
  }

  // Get or create User B
  let userIdB;
  const { data: existingUsersB } = await supabase.auth.admin.listUsers();
  const userB = existingUsersB.users.find(u => u.email === 'feature13_user_b@test.com');

  if (userB) {
    console.log('✓ User B exists:', userB.id);
    userIdB = userB.id;
  } else {
    const { data: newUserB } = await supabase.auth.admin.createUser({
      email: 'feature13_user_b@test.com',
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: { name: 'Feature 13 User B' }
    });
    console.log('✓ Created User B:', newUserB.user.id);
    userIdB = newUserB.user.id;
  }

  // Create a test decision for User A
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userIdA,
      title: 'Feature 13 Test Decision - User A Only',
      status: 'draft'
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError.message);
    process.exit(1);
  }

  console.log('\n✓ Created test decision for User A');
  console.log('  Decision ID:', decision.id);
  console.log('  Title:', decision.title);

  console.log('\n=== TEST SETUP COMPLETE ===\n');
  console.log('USER A (owner):');
  console.log('  Email: feature13_user_a@test.com');
  console.log('  Password: TestPass123!');
  console.log('  User ID:', userIdA);
  console.log('\nUSER B (attacker):');
  console.log('  Email: feature13_user_b@test.com');
  console.log('  Password: TestPass123!');
  console.log('  User ID:', userIdB);
  console.log('\nTARGET DECISION:');
  console.log('  ID:', decision.id);
  console.log('  URL: http://localhost:5173/decisions/' + decision.id);
  console.log('\nExpected behavior:');
  console.log('  - User A can view their decision');
  console.log('  - User B gets 404 or access denied when trying to view User A\'s decision');
  console.log('');
}

setupTestUsers().catch(console.error);
