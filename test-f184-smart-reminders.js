/**
 * Feature #184 Test: Smart automatic reminders (2 weeks default, AI-adjusted by decision type)
 *
 * This test verifies that reminders are created with category-specific timing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Category name -> Expected reminder days
const categoryTests = [
  { category: 'Finance', expectedDays: 7, description: 'Financial decisions' },
  { category: 'Business', expectedDays: 7, description: 'Business decisions' },
  { category: 'Career', expectedDays: 14, description: 'Career decisions' },
  { category: 'Health', expectedDays: 21, description: 'Health decisions' },
  { category: 'Relationships', expectedDays: 28, description: 'Relationship decisions' },
  { category: 'Education', expectedDays: 28, description: 'Education decisions' },
  { category: 'Lifestyle', expectedDays: 10, description: 'Lifestyle decisions' },
  { category: null, expectedDays: 14, description: 'No category (default)' },
  { category: 'UnknownCategory', expectedDays: 14, description: 'Unknown category (default)' },
];

async function getTestUserId() {
  // Use a known test user - you can change this email as needed
  const testEmail = 'test@example.com';

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', testEmail)
    .maybeSingle();

  if (profile) {
    console.log(`Using existing test user: ${testEmail} (ID: ${profile.id})`);
    return profile.id;
  }

  // If no test user exists, try to get any user
  const { data: anyProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .limit(1)
    .single();

  if (anyProfile) {
    console.log(`Using existing user: ${anyProfile.email} (ID: ${anyProfile.id})`);
    return anyProfile.id;
  }

  throw new Error('No users found in database. Please create a test user first.');
}

async function findOrCreateCategory(userId, categoryName) {
  if (!categoryName) return null;

  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', categoryName)
    .single();

  if (existing) return existing.id;

  // Create category
  const { data } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: categoryName,
      color: '#00d4aa',
      icon: '📁',
      decision_count: 0,
      positive_rate: 0,
      is_system: true,
    })
    .select()
    .single();

  return data.id;
}

async function createDecisionWithCategory(userId, categoryId) {
  // Create a decision
  const { data: decision } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      category_id: categoryId,
      title: `F184 Test Decision - ${categoryId ? 'With Category' : 'No Category'}`,
      status: 'deliberating',
      detected_emotional_state: 'neutral',
    })
    .select()
    .single();

  return decision;
}

async function markDecisionAsDecided(decisionId, userId) {
  // Update decision status to 'decided'
  const { data: decision } = await supabase
    .from('decisions')
    .update({
      status: 'decided',
      decided_at: new Date().toISOString(),
    })
    .eq('id', decisionId)
    .eq('user_id', userId)
    .select()
    .single();

  return decision;
}

async function getReminderForDecision(decisionId) {
  const { data } = await supabase
    .from('DecisionsFollowUpReminders')
    .select('*')
    .eq('decision_id', decisionId)
    .single();

  return data;
}

async function calculateReminderDays(remindAt) {
  const now = new Date();
  const reminderDate = new Date(remindAt);
  const diffTime = Math.abs(reminderDate - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

async function testSmartReminders() {
  console.log('='.repeat(70));
  console.log('Feature #184 Test: Smart Automatic Reminders');
  console.log('Testing AI-adjusted reminder timing by decision category');
  console.log('='.repeat(70));

  const userId = await getTestUserId();

  console.log(`\nTest User ID: ${userId}\n`);

  const results = [];

  for (const test of categoryTests) {
    console.log(`\n--- Testing: ${test.description} ---`);
    console.log(`Category: ${test.category || 'None'}`);
    console.log(`Expected Reminder Days: ${test.expectedDays}`);

    try {
      // 1. Find or create category
      const categoryId = test.category
        ? await findOrCreateCategory(userId, test.category)
        : null;

      // 2. Create decision
      const decision = await createDecisionWithCategory(userId, categoryId);
      console.log(`Created decision: ${decision.id}`);

      // 3. Mark as decided (triggers reminder creation)
      const updated = await markDecisionAsDecided(decision.id, userId);
      console.log(`Marked as decided`);

      // 4. Get the reminder
      const reminder = await getReminderForDecision(decision.id);

      if (!reminder) {
        console.log(`❌ FAILED: No reminder created`);
        results.push({
          test: test.description,
          category: test.category,
          expected: test.expectedDays,
          actual: null,
          passed: false,
        });
        continue;
      }

      // 5. Calculate actual reminder days
      const actualDays = await calculateReminderDays(reminder.remind_at);
      console.log(`Reminder created for: ${reminder.remind_at}`);
      console.log(`Actual Reminder Days: ${actualDays}`);

      // 6. Verify
      const passed = actualDays === test.expectedDays;
      console.log(passed ? '✅ PASSED' : '❌ FAILED');

      results.push({
        test: test.description,
        category: test.category,
        expected: test.expectedDays,
        actual: actualDays,
        passed,
      });

    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
      results.push({
        test: test.description,
        category: test.category,
        expected: test.expectedDays,
        actual: 'ERROR',
        passed: false,
        error: error.message,
      });
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  console.log('Detailed Results:');
  console.table(results);

  return passed === total;
}

// Run tests
testSmartReminders()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
