const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function deleteDecision() {
  try {
    // Sign in as the test user
    const { data: { user, session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'f72-trash-test@example.com',
      password: 'test123456',
    });

    if (signInError) {
      console.log('Sign in error:', signInError.message);
      return;
    }

    console.log('Signed in as:', user.email);

    const decisionId = 'd193bbaa-bced-4d86-9a7c-5885bc4e13d7';

    // Soft delete the decision
    const { data, error } = await supabase
      .from('decisions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', decisionId)
      .select()
      .single();

    if (error) {
      console.log('Error deleting decision:', error.message);
      return;
    }

    console.log('Decision soft-deleted:', data.id);
    console.log('Deleted at:', data.deleted_at);

    // Verify it's in the trash
    const { data: trashCheck } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decisionId)
      .single();

    console.log('Verification - deleted_at is set:', !!trashCheck.deleted_at);

  } catch (err) {
    console.log('Error:', err.message);
  }
}

deleteDecision();
