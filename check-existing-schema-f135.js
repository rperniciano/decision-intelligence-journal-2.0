// ============================================================================
// Check what columns ACTUALLY exist in DecisionsFollowUpReminders table
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingSchema() {
  console.log('================================================================================');
  console.log('Feature #135: Check Existing Database Schema');
  console.log('================================================================================\n');

  try {
    // Try to query WITHOUT specifying columns (let server return what exists)
    console.log('🔍 Attempt 1: Query all columns (*)');
    console.log('-------------------------------------------');

    const { data, error, status } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Query failed:');
      console.log('   Status:', status);
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Query successful!');
      console.log('\n📊 Columns found in table:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`   - ${col}: ${typeof data[0][col]}`);
      });
      console.log('\n📄 Sample data:');
      console.log('  ', JSON.stringify(data[0], null, 2));
    } else {
      console.log('✅ Query successful but table is empty');
      console.log('   (No data to inspect columns)');
    }

    console.log('\n🔍 Attempt 2: Query specific existing columns');
    console.log('-------------------------------------------');

    const { data: data2, error: error2 } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('id, decision_id, status, created_at')
      .limit(1);

    if (error2) {
      console.log('❌ Query failed:', error2.message);
    } else {
      console.log('✅ Confirmed columns exist:');
      console.log('   - id');
      console.log('   - decision_id');
      console.log('   - status');
      console.log('   - created_at');
    }

    console.log('\n🔍 Attempt 3: Check if remind_at exists via count');
    console.log('-------------------------------------------');

    const { count, error: error3 } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('*', { count: 'exact', head: true });

    if (error3) {
      console.log('❌ Query failed:', error3.message);
    } else {
      console.log(`✅ Table has ${count} total reminders`);
    }

    console.log('\n================================================================================');
    console.log('CONCLUSION');
    console.log('================================================================================\n');

    if (error && error.code === '42703') {
      console.log('❌ Column "remind_at" does NOT exist in database');
      console.log('\nCurrent schema (confirmed):');
      console.log('   - id: UUID');
      console.log('   - decision_id: UUID');
      console.log('   - status: VARCHAR(20)');
      console.log('   - created_at: TIMESTAMPTZ');
      console.log('\nMissing columns:');
      console.log('   ❌ remind_at: TIMESTAMPTZ');
      console.log('   ❌ user_id: UUID');
      console.log('\nMigration is required to add these columns.');
    } else if (!error && data) {
      console.log('✅ Columns may already exist!');
      console.log('\nFound columns:', Object.keys(data[0] || {}).join(', '));
    } else {
      console.log('⚠️  Unable to determine schema');
      console.log('Table may be empty or query method insufficient');
    }

    console.log('\n================================================================================\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkExistingSchema();
