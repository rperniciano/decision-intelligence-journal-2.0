const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyBulkDelete() {
  try {
    // Sign in as test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'session35test@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    const userId = authData.user.id;

    // Search for the bulk delete test decisions
    const { data: decisions, error } = await supabase
      .from('decisions')
      .select('id, title, deleted_at')
      .eq('user_id', userId)
      .ilike('title', '%BULK_DELETE_TEST%SESSION42%');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\n=== Bulk Delete Test Decisions ===');
    if (decisions.length === 0) {
      console.log('✅ All BULK_DELETE_TEST_*_SESSION42 decisions have been deleted (soft delete)');
    } else {
      console.log('Found decisions:');
      decisions.forEach(d => {
        console.log(`  - ${d.title}`);
        console.log(`    ID: ${d.id}`);
        console.log(`    Deleted at: ${d.deleted_at || 'NOT DELETED'}`);
      });
    }

    // Check total decision count
    const { data: allDecisions, count } = await supabase
      .from('decisions')
      .select('title', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null);

    console.log(`\n✅ Total active decisions for user: ${count}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyBulkDelete();
