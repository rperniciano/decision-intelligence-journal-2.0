// Feature #215: Decision Score Test Data Generator
// Creates test data to verify Decision Score calculation based on:
// - Outcome Rate (40 points)
// - Process Quality (30 points): options and pros/cons
// - Follow-through (30 points): outcome recording rate

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  // Generate a unique email
  const timestamp = Date.now();
  const email = `f215-test-${timestamp}@example.com`;
  const password = 'test123456';

  console.log(`Creating test user: ${email}`);

  // Create user via Supabase Auth
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: { name: 'F215 Test User' }
  });

  if (userError) {
    console.error('Error creating user:', userError);
    throw userError;
  }

  console.log('User created:', userData.user.id);
  return userData.user;
}

async function createDecisionWithDetails(userId, title, outcome, optionsCount, prosConsCount) {
  // First create the decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title,
      status: outcome ? 'decided' : 'deliberating',
      outcome: outcome, // 'better', 'as_expected', 'worse', or null
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    throw decisionError;
  }

  console.log(`  Created decision: ${title} (outcome: ${outcome || 'none'})`);

  // Create options
  const options = [];
  for (let i = 0; i < optionsCount; i++) {
    const { data: option, error: optionError } = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        name: `Option ${i + 1}`,
        display_order: i,
        is_chosen: i === 0, // First option is chosen
      })
      .select()
      .single();

    if (optionError) {
      console.error('Error creating option:', optionError);
      throw optionError;
    }

    options.push(option);

    // Create pros/cons for this option
    for (let j = 0; j < prosConsCount; j++) {
      const isPro = j % 2 === 0;
      await supabase
        .from('pros_cons')
        .insert({
          option_id: option.id,
          type: isPro ? 'pro' : 'con',
          content: `${isPro ? 'Pro' : 'Con'} ${j + 1} for ${option.name}`,
          position: j,
          ai_generated: false,
        });
    }
  }

  console.log(`    Created ${optionsCount} options with ${optionsCount * prosConsCount} pros/cons`);

  return decision;
}

async function main() {
  try {
    // Create test user
    const user = await createTestUser();
    const userId = user.id;

    console.log('\nCreating test decisions for Decision Score calculation...\n');

    // Scenario 1: Positive outcomes with good process quality
    // Expected: High score (good outcome rate + good process quality + good follow-through)
    console.log('Scenario 1: Positive outcomes with good process');
    await createDecisionWithDetails(
      userId,
      'F215_TEST_1: Job offer acceptance',
      'better',
      3, // 3 options
      3  // 3 pros/cons per option
    );
    await createDecisionWithDetails(
      userId,
      'F215_TEST_2: Moving to new city',
      'better',
      4, // 4 options
      2  // 2 pros/cons per option
    );
    await createDecisionWithDetails(
      userId,
      'F215_TEST_3: Starting a business',
      'better',
      2, // 2 options
      4  // 4 pros/cons per option
    );
    await createDecisionWithDetails(
      userId,
      'F215_TEST_4: Investment decision',
      'better',
      3, // 3 options
      3  // 3 pros/cons per option
    );
    await createDecisionWithDetails(
      userId,
      'F215_TEST_5: Career change',
      'as_expected',
      3, // 3 options
      2  // 2 pros/cons per option
    );

    // Scenario 2: Negative outcomes with poor process quality
    // Expected: Lower score (poor outcome rate + poor process quality)
    console.log('\nScenario 2: Negative outcomes with poor process');
    await createDecisionWithDetails(
      userId,
      'F215_TEST_6: Impulse purchase',
      'worse',
      1, // 1 option (poor process)
      1  // 1 pro/con (poor process)
    );
    await createDecisionWithDetails(
      userId,
      'F215_TEST_7: Quick relationship choice',
      'worse',
      1, // 1 option
      0  // no pros/cons
    );
    await createDecisionWithDetails(
      userId,
      'F215_TEST_8: Rash decision',
      'worse',
      2, // 2 options
      1  // 1 pro/con
    );

    // Scenario 3: No outcome recorded (tests follow-through component)
    // Expected: Lower follow-through score
    console.log('\nScenario 3: Decisions without outcomes (poor follow-through)');
    await createDecisionWithDetails(
      userId,
      'F215_TEST_9: Unfinished decision A',
      null, // no outcome
      2, // 2 options
      2  // 2 pros/cons
    );
    await createDecisionWithDetails(
      userId,
      'F215_TEST_10: Unfinished decision B',
      null, // no outcome
      3, // 3 options
      3  // 3 pros/cons
    );
    await createDecisionWithDetails(
      userId,
      'F215_TEST_11: Unfinished decision C',
      null, // no outcome
      2, // 2 options
      1  // 1 pro/con
    );

    console.log('\n✅ Test data created successfully!');
    console.log('\nTest Summary:');
    console.log('- 5 decisions with positive outcomes (good process quality)');
    console.log('- 3 decisions with negative outcomes (poor process quality)');
    console.log('- 3 decisions without outcomes (tests follow-through)');
    console.log('\nTotal: 11 decisions');
    console.log('- 8 with outcomes recorded (73% follow-through)');
    console.log('- 5 positive, 2 neutral, 1 negative = 62.5% positive outcome rate');
    console.log('- Average options per decision: ~2.5');
    console.log('- Average pros/cons per option: ~2.2');
    console.log('\nExpected Decision Score Calculation:');
    console.log('- Outcome Rate Score: 62.5% positive → ~34 points (max 40)');
    console.log('- Process Quality Score: 2.5 options × 5 = 12.5, 2.2 pros/cons × 5 = 11 → ~23.5 points (max 30)');
    console.log('- Follow-through Score: 73% recorded → ~22 points (max 30)');
    console.log('- Total Expected Score: ~79-80 points (out of 100)');
    console.log('\nLogin credentials:');
    console.log(`Email: ${user.email}`);
    console.log('Password: test123456');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
