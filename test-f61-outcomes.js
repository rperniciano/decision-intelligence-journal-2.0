// Test Feature #61: Outcome attached to correct decision
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Find or create a test user
async function getOrCreateTestUser() {
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'f61test@example.com')
    .single();

  if (existingUser) {
    console.log('Using existing test user:', existingUser.id);
    return existingUser;
  }

  // Try to get user from auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (!listError && users) {
    const existingAuthUser = users.find(u => u.email === 'f61test@example.com');
    if (existingAuthUser) {
      console.log('Found existing auth user:', existingAuthUser.id);
      return { id: existingAuthUser.id };
    }
  }

  // Create new user
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email: 'f61test@example.com',
    password: 'test123456',
    email_confirm: true,
  });

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  console.log('Created new test user:', newUser.user.id);
  return newUser.user;
}

// Get a category ID
async function getCategoryId() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (!categories || categories.length === 0) {
    throw new Error('No categories found');
  }

  return categories[0].id;
}

// Create test decisions
async function createTestDecisions(userId, categoryId) {
  // Create DECISION_A
  const { data: decisionA, error: errorA } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'DECISION_A - Test Feature 61',
      status: 'pending',
      category_id: categoryId
    })
    .select()
    .single();

  if (errorA) {
    console.error('Error creating DECISION_A:', errorA);
    throw errorA;
  }

  console.log('Created DECISION_A:', decisionA.id);

  // Create DECISION_B
  const { data: decisionB, error: errorB } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'DECISION_B - Test Feature 61',
      status: 'pending',
      category_id: categoryId
    })
    .select()
    .single();

  if (errorB) {
    console.error('Error creating DECISION_B:', errorB);
    throw errorB;
  }

  console.log('Created DECISION_B:', decisionB.id);

  return { decisionA, decisionB };
}

// Record outcome for DECISION_A
async function createOutcome(userId, decisionId) {
  const { data: outcome, error } = await supabase
    .from('outcomes')
    .insert({
      user_id: userId,
      decision_id: decisionId,
      satisfaction_level: 7,
      outcome_text: 'This outcome should only appear on DECISION_A',
      would_choose_same_option: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating outcome:', error);
    throw error;
  }

  console.log('Created outcome for decision:', decisionId);
  return outcome;
}

async function main() {
  try {
    console.log('=== Feature #61 Test Setup ===\n');

    // Get or create test user
    const user = await getOrCreateTestUser();
    const userId = user.id;

    // Clean up any existing test data
    await supabase.from('outcomes').delete().eq('user_id', userId).eq('outcome_text', 'This outcome should only appear on DECISION_A');
    await supabase.from('decisions').delete().eq('user_id', userId).like('title', 'DECISION_% - Test Feature 61');
    console.log('Cleaned up old test data\n');

    // Get category ID
    const categoryId = await getCategoryId();

    // Create test decisions
    const { decisionA, decisionB } = await createTestDecisions(userId, categoryId);

    // Create outcome for DECISION_A only
    await createOutcome(userId, decisionA.id);

    console.log('\n=== Test Data Created Successfully ===');
    console.log('DECISION_A ID:', decisionA.id);
    console.log('DECISION_B ID:', decisionB.id);
    console.log('\nNext steps:');
    console.log('1. Login as f61test@example.com / test123456');
    console.log('2. Navigate to DECISION_A detail page');
    console.log('3. Verify outcome appears');
    console.log('4. Navigate to DECISION_B detail page');
    console.log('5. Verify NO outcome appears');
    console.log('\nURLs:');
    console.log(`- DECISION_A: http://localhost:5190/decisions/${decisionA.id}`);
    console.log(`- DECISION_B: http://localhost:5190/decisions/${decisionB.id}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
