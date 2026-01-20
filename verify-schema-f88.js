/**
 * Direct schema verification for Feature #88
 * Uses information_schema to check column existence
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySchema() {
  console.log('🔍 Verifying database schema for Feature #88...\n');

  try {
    // Query information_schema to check column existence
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, character_maximum_length')
      .eq('table_name', 'decisions')
      .in('column_name', ['abandon_reason', 'abandon_note']);

    if (error) {
      console.error('❌ Error querying schema:', error.message);
      return false;
    }

    console.log('📊 Schema Query Results:');
    console.log('─'.repeat(60));

    if (!columns || columns.length === 0) {
      console.log('❌ Columns NOT found in information_schema');
      console.log('\nMissing columns:');
      console.log('   - abandon_reason');
      console.log('   - abandon_note');
      console.log('\n⛔ Feature #88 remains BLOCKED by database schema');
      return false;
    }

    console.log(`Found ${columns.length} columns:\n`);

    const foundColumns = {
      abandon_reason: false,
      abandon_note: false
    };

    columns.forEach(col => {
      console.log(`✅ ${col.column_name}`);
      console.log(`   Type: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
      foundColumns[col.column_name] = true;
    });

    console.log('\n' + '─'.repeat(60));

    if (foundColumns.abandon_reason && foundColumns.abandon_note) {
      console.log('\n🎉 SUCCESS! Both columns exist!');
      console.log('✅ Feature #88 is UNBLOCKED - ready for testing!');
      return true;
    } else {
      console.log('\n⚠️  Partial schema - some columns missing:');
      if (!foundColumns.abandon_reason) console.log('   ❌ abandon_reason');
      if (!foundColumns.abandon_note) console.log('   ❌ abandon_note');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

verifySchema().then(success => {
  process.exit(success ? 0 : 1);
});
