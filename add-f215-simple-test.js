// Feature #215: Decision Score Test Data Generator (Simple Version)
// Creates test data to verify Decision Score calculation

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    // Use existing user or create new one
    const email = `f215-test-${Date.now()}@example.com`;

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: 'test123456',
      email_confirm: true,
      user_metadata: { name: 'F215 Test User' }
    });

    if (userError) throw userError;

    const userId = userData.user.id;
    console.log(`User created: ${email}`);
    console.log('User ID:', userId);

    console.log('\nCreating test decisions for Decision Score calculation...\n');

    // Scenario 1: Positive outcomes (5 decisions)
    console.log('Creating 5 decisions with positive outcomes...');
    for (let i = 1; i <= 5; i++) {
      await supabase.from('decisions').insert({
        user_id: userId,
        title: `F215_TEST_${i}: Positive outcome decision`,
        status: 'decided',
        outcome: 'better',
      });
    }

    // Scenario 2: Negative outcomes (2 decisions)
    console.log('Creating 2 decisions with negative outcomes...');
    for (let i = 6; i <= 7; i++) {
      await supabase.from('decisions').insert({
        user_id: userId,
        title: `F215_TEST_${i}: Negative outcome decision`,
        status: 'decided',
        outcome: 'worse',
      });
    }

    // Scenario 3: No outcome (3 decisions) - tests follow-through
    console.log('Creating 3 decisions without outcomes...');
    for (let i = 8; i <= 10; i++) {
      await supabase.from('decisions').insert({
        user_id: userId,
        title: `F215_TEST_${i}: No outcome decision`,
        status: 'deliberating',
        outcome: null,
      });
    }

    console.log('\n✅ Test data created successfully!');
    console.log('\nTest Summary:');
    console.log('- 5 decisions with positive outcomes (better)');
    console.log('- 2 decisions with negative outcomes (worse)');
    console.log('- 3 decisions without outcomes (deliberating)');
    console.log('\nTotal: 10 decisions');
    console.log('- 7 with outcomes recorded (70% follow-through)');
    console.log('- 5 positive / 7 total outcomes = 71% positive outcome rate');
    console.log('\nExpected Decision Score Calculation (without options/prosCons):');
    console.log('- Outcome Rate Score: 71% positive → ~31 points (max 40)');
    console.log('- Process Quality Score: 0 options/pros-cons → 0 points (max 30)');
    console.log('- Follow-through Score: 70% recorded → ~21 points (max 30)');
    console.log('- Total Expected Score: ~52 points (out of 100)');
    console.log('\nLogin credentials:');
    console.log(`Email: ${email}`);
    console.log('Password: test123456');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
