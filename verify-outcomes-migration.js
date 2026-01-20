import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('================================================================');
console.log('COMPREHENSIVE OUTCOMES TABLE MIGRATION VERIFICATION');
console.log('================================================================\n');

// Test 1: Try to select from outcomes table
console.log('TEST 1: Checking if outcomes table exists...');
const { data: outcomesData, error: outcomesError } = await supabase
  .from('outcomes')
  .select('*')
  .limit(1);

if (outcomesError) {
  console.log('❌ Table does not exist or not accessible');
  console.log('   Error:', outcomesError.message);
  console.log('   Code:', outcomesError.code);
  console.log('   Hint:', outcomesError.hint);
} else {
  console.log('✅ Table exists!');
  console.log('   Sample data:', outcomesData);
}

// Test 2: Check if table is in information_schema
console.log('\nTEST 2: Checking information_schema for outcomes table...');
const { data: schemaData, error: schemaError } = await supabase
  .rpc('get_tables', { schema_name: 'public' })
  .select('*')
  .ilike('table_name', 'outcomes');

// Alternative: Try direct query to information_schema
const { data: infoData, error: infoError } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .eq('table_name', 'outcomes')
  .single();

if (infoError) {
  console.log('❌ Not found in information_schema');
  console.log('   Error:', infoError.message);
} else {
  console.log('✅ Found in information_schema:', infoData);
}

// Test 3: Check PostgreSQL system catalogs (might not work via REST API)
console.log('\nTEST 3: Checking pg_class system catalog...');
try {
  const { data: pgClassData, error: pgClassError } = await supabase
    .from('pg_class')
    .select('relname')
    .eq('relname', 'outcomes')
    .limit(1);

  if (pgClassError) {
    console.log('❌ Cannot access pg_class (expected - REST API limitation)');
    console.log('   Error:', pgClassError.message);
  } else {
    console.log('✅ Found in pg_class:', pgClassData);
  }
} catch (e) {
  console.log('❌ Cannot access pg_class (expected)');
}

// Test 4: Try to create a test outcome (will fail if table doesn't exist)
console.log('\nTEST 4: Attempting to insert a test outcome...');
const testDecisionId = '00000000-0000-0000-0000-000000000000'; // Invalid UUID, but tests table existence

const { data: insertData, error: insertError } = await supabase
  .from('outcomes')
  .insert({
    decision_id: testDecisionId,
    result: 'as_expected',
    satisfaction: 3,
    check_in_number: 1
  })
  .select()
  .single();

if (insertError) {
  if (insertError.code === 'PGRST204' || insertError.message.includes('Could not find')) {
    console.log('❌ Table does not exist (insert failed)');
    console.log('   Error:', insertError.message);
  } else if (insertError.code === '23503') {
    console.log('✅ Table exists! (Insert failed due to foreign key constraint)');
    console.log('   This is expected - test decision_id does not exist');
    console.log('   Error:', insertError.message);
  } else {
    console.log('⚠️  Unexpected error:', insertError.message, insertError.code);
  }
} else {
  console.log('✅ Insert succeeded (unexpected):', insertData);
}

// Test 5: Check if any decisions have outcome data in legacy format
console.log('\nTEST 5: Checking for legacy outcome data...');
const { data: decisionsData, error: decisionsError } = await supabase
  .from('decisions')
  .select('id, title, outcome, outcome_recorded_at')
  .not('outcome', 'is', null)
  .limit(5);

if (decisionsError) {
  console.log('❌ Could not check decisions:', decisionsError.message);
} else {
  console.log(`✅ Found ${decisionsData.length} decisions with legacy outcome data`);
  if (decisionsData.length > 0) {
    console.log('   Sample:', decisionsData[0]);
  }
}

console.log('\n================================================================');
console.log('VERIFICATION SUMMARY');
console.log('================================================================');
console.log('\nIf ALL tests show the table does not exist, the migration');
console.log('must be executed manually in Supabase Dashboard:\n');
console.log('  https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
console.log('Migration file: apps/api/migrations/create_outcomes_table.sql\n');
