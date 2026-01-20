// Test if we can create a decision with abandon columns through the API
// This will tell us if columns exist by testing actual API calls

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function testAbandonColumns() {
  console.log('Testing abandon columns through actual API operations...\n');

  try {
    // Try to create a test decision with abandon columns
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email: `test-abandon-${Date.now()}@example.com`,
      password: 'test123456',
    });

    if (authError) throw authError;

    const userId = user.id;

    // Create a test decision
    const { data: decision, error: createError } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: 'Test Abandon Decision',
        status: 'draft',
        category_id: null,
        abandon_reason: 'test_reason',
        abandon_note: 'test_note'
      })
      .select()
      .single();

    if (createError) {
      if (createError.message.includes('abandon_reason') || createError.message.includes('abandon_note')) {
        console.log('❌ Columns do NOT exist in database');
        console.log('Error:', createError.message);
        await supabase.auth.admin.deleteUser(userId);
        process.exit(1);
      }
      throw createError;
    }

    console.log('✅ Columns EXIST! Test decision created with abandon columns.');
    console.log('Decision ID:', decision.id);

    // Clean up
    await supabase.from('decisions').delete().eq('id', decision.id);
    await supabase.auth.admin.deleteUser(userId);
    console.log('✅ Test data cleaned up');

    process.exit(0);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testAbandonColumns();
