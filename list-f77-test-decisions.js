import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

// Use anon key to test from user perspective
const supabase = createClient(supabaseUrl, anonKey);

console.log('================================================================');
console.log('FEATURE #77 TEST DATA PREPARATION');
console.log('================================================================\n');

// First, sign in as test user
console.log('Step 1: Signing in as f77test@example.com...');
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'f77test@example.com',
  password: 'test123456'
});

if (authError) {
  console.log('❌ Login failed:', authError.message);

  // Try to create the user
  console.log('\nAttempting to create user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'f77test@example.com',
    password: 'test123456'
  });

  if (signUpError) {
    console.log('❌ Sign up failed:', signUpError.message);
    process.exit(1);
  }

  console.log('✅ User created:', signUpData.user?.id);

  if (!signUpData.user?.id) {
    console.log('❌ No user ID after sign up');
    process.exit(1);
  }

  // Sign in with the new user
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'f77test@example.com',
    password: 'test123456'
  });

  if (signInError || !signInData.user?.id) {
    console.log('❌ Sign in after sign up failed:', signInError?.message);
    process.exit(1);
  }

  console.log('✅ Signed in:', signInData.user?.id);
  var userId = signInData.user?.id;
} else {
  console.log('✅ Logged in:', authData.user?.id);
  var userId = authData.user?.id;
}

if (!userId) {
  console.log('❌ No user ID');
  process.exit(1);
}

// Get decisions for this user
console.log('\nStep 2: Fetching existing decisions...');
const { data: decisions, error: decisionsError } = await supabase
  .from('decisions')
  .select('id, title, status, outcome, outcome_recorded_at, created_at')
  .eq('user_id', userId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false });

if (decisionsError) {
  console.log('❌ Error fetching decisions:', decisionsError.message);
  process.exit(1);
}

console.log(`✅ Found ${decisions.length} decisions`);

if (decisions.length > 0) {
  console.log('\nExisting decisions:');
  decisions.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.title}`);
    console.log(`     ID: ${d.id}`);
    console.log(`     Status: ${d.status}`);
    console.log(`     Outcome: ${d.outcome || 'none'}`);
    console.log(`     Created: ${d.created_at}`);
  });

  // Check if any have F77 in the title
  const f77Decision = decisions.find(d => d.title.includes('F77'));

  if (f77Decision) {
    console.log('\n✅ Found existing F77 test decision:', f77Decision.id);
  } else {
    console.log('\n⚠️  No F77 test decision found, will need to create one');
  }
} else {
  console.log('\n⚠️  No decisions found, will need to create test data');
}

// Check outcomes table status
console.log('\nStep 3: Checking outcomes table status...');
const { data: outcomes, error: outcomesError } = await supabase
  .from('outcomes')
  .select('*')
  .limit(1);

if (outcomesError) {
  console.log('❌ Outcomes table does not exist');
  console.log('   Error:', outcomesError.message);
  console.log('   Code:', outcomesError.code);
  console.log('\n   Will use LEGACY FORMAT (outcome stored on decision)');
} else {
  console.log('✅ Outcomes table exists!');
  console.log('   Will use NEW FORMAT (multiple check-ins)');
}

console.log('\n================================================================');
console.log('SUMMARY');
console.log('================================================================');
console.log(`User ID: ${userId}`);
console.log(`Decisions: ${decisions.length}`);
console.log(`Outcomes table: ${outcomesError ? 'NOT EXISTS (using legacy)' : 'EXISTS'}`);
console.log('\nTest plan:');
if (!decisions.find(d => d.title.includes('F77'))) {
  console.log('1. Create test decision "F77_TEST_DECISION"');
}
console.log('2. Record first outcome (check-in #1)');
console.log('3. Verify outcome appears with "1st check-in" badge');
console.log('4. Record second outcome (check-in #2)');
console.log('5. Verify both outcomes appear with correct badges');
console.log('6. Mark feature as PASSING');
