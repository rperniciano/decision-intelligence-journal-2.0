// Test the outcomes endpoint directly to debug the error
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_DECISION_ID = 'f7ceacdd-9742-44df-9811-205a37e2cdb4';

async function testOutcomesEndpoint() {
  console.log('Testing outcomes table access...');
  console.log('Decision ID:', TEST_DECISION_ID);

  try {
    // Test 1: Try to query outcomes table
    console.log('\n1. Testing outcomes table query...');
    const { data: outcomes, error: outcomesError } = await supabase
      .from('outcomes')
      .select('*')
      .eq('decision_id', TEST_DECISION_ID);

    if (outcomesError) {
      console.log('   Error Code:', outcomesError.code);
      console.log('   Error Message:', outcomesError.message);
      console.log('   Error Details:', outcomesError.details);
      console.log('   Error Hint:', outcomesError.hint);
    } else {
      console.log('   ✅ Outcomes table exists!');
      console.log('   Found', outcomes?.length || 0, 'outcomes');
    }

    // Test 2: Try to query decision with legacy outcome columns
    console.log('\n2. Testing decision table query (with outcome columns)...');
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .select('id, outcome, outcome_notes, outcome_recorded_at')
      .eq('id', TEST_DECISION_ID)
      .maybeSingle();

    if (decisionError) {
      console.log('   Error:', decisionError.message);
    } else {
      console.log('   ✅ Decision found');
      console.log('   Has outcome:', !!decision.outcome);
    }

    // Test 3: Try with outcome_satisfaction column
    console.log('\n3. Testing decision table query (with outcome_satisfaction column)...');
    try {
      const { data: decision2, error: decisionError2 } = await supabase
        .from('decisions')
        .select('id, outcome, outcome_notes, outcome_satisfaction, outcome_recorded_at')
        .eq('id', TEST_DECISION_ID)
        .maybeSingle();

      if (decisionError2) {
        console.log('   Error Code:', decisionError2.code);
        console.log('   Error Message:', decisionError2.message);
        console.log('   → outcome_satisfaction column does NOT exist');
      } else {
        console.log('   ✅ outcome_satisfaction column exists');
      }
    } catch (e) {
      console.log('   Exception:', e.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOutcomesEndpoint();
