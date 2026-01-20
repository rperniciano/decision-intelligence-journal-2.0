/**
 * Check the actual database schema for the decisions table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkSchema() {
  console.log('Checking database schema for decisions table...\n');

  try {
    // Try to select a decision to see what columns are returned
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const testUser = users.find(u => u.email === 'f96-test-1768888401473@example.com');

    if (!testUser) {
      throw new Error('Test user not found');
    }

    // Create a minimal decision to see the actual columns
    const timestamp = Date.now();
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        user_id: testUser.id,
        title: `Schema Check - ${timestamp}`,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test decision:', error.message);
      return;
    }

    console.log('✅ Created test decision successfully');
    console.log('\nColumns returned by database:');
    console.log(Object.keys(data).join(', '));
    console.log('\nFull decision object:');
    console.log(JSON.stringify(data, null, 2));

    // Check if emotional_state exists
    if ('emotional_state' in data) {
      console.log('\n✅ emotional_state column EXISTS!');
    } else {
      console.log('\n❌ emotional_state column DOES NOT EXIST');
      console.log('\nExpected columns based on code:');
      console.log('- user_id');
      console.log('- title');
      console.log('- status');
      console.log('- emotional_state (MISSING!)');
      console.log('- category');
      console.log('- notes');
      console.log('- transcription');
      console.log('- created_at');
      console.log('- updated_at');
      console.log('- decided_at');
      console.log('- deleted_at');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSchema();
