// Setup test data for Feature #77: Multiple check-ins tracked separately
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Debug environment variables
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_EMAIL = `f77-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'test123456';
const DECISION_TITLE = 'F77 Test Decision: Multiple Check-ins';

async function setupTestData() {
  console.log('Setting up test data for Feature #77...');

  try {
    // 1. Create test user
    console.log('1. Creating test user...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true
    });

    if (userError) throw userError;
    const userId = userData.user.id;
    console.log('✅ User created:', TEST_EMAIL);

    // 2. Create a decision with decided status (minimal columns)
    console.log('2. Creating test decision...');
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: DECISION_TITLE,
        status: 'decided'
      })
      .select()
      .single();

    if (decisionError) throw decisionError;
    const decisionId = decision.id;
    console.log('✅ Decision created:', decisionId);

    // 3. Check if outcomes table exists
    console.log('3. Checking if outcomes table exists...');
    const { data: outcomesCheck, error: outcomesError } = await supabase
      .from('outcomes')
      .select('id')
      .limit(1);

    if (outcomesError) {
      console.log('⚠️  outcomes table does NOT exist yet');
      console.log('   Error:', outcomesError.message);
      console.log('   Feature will use legacy fallback mode');
    } else {
      console.log('✅ outcomes table EXISTS!');

      // 4. If table exists, create a test outcome
      console.log('4. Creating test outcome...');
      const { data: outcome, error: outcomeError } = await supabase
        .from('outcomes')
        .insert({
          decision_id: decisionId,
          result: 'better',
          satisfaction: 5,
          learned: 'First check-in test',
          recorded_at: new Date().toISOString(),
          check_in_number: 1
        })
        .select('id')
        .single();

      if (outcomeError) {
        console.log('⚠️  Could not create outcome:', outcomeError.message);
      } else {
        console.log('✅ Test outcome created:', outcome.id);
      }
    }

    // Output test credentials
    console.log('\n' + '='.repeat(60));
    console.log('TEST DATA READY');
    console.log('='.repeat(60));
    console.log(`Email:    ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    console.log(`Decision: ${DECISION_TITLE}`);
    console.log(`Decision ID: ${decisionId}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setupTestData();
