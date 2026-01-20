const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestDecision() {
  try {
    // Sign in as the test user
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'f72-trash-test@example.com',
      password: 'test123456',
    });

    if (signInError) {
      console.log('Sign in error:', signInError.message);
      return;
    }

    console.log('Signed in as:', user.email);
    console.log('User ID:', user.id);

    // Create the decision
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        title: 'TRASH_TEST_ITEM',
        description: 'This is a test decision for Feature #72 trash functionality verification',
        status: 'draft',
      })
      .select()
      .single();

    if (decisionError) {
      console.log('Error creating decision:', decisionError.message);
      return;
    }

    console.log('Decision created:', decision.id);
    console.log('Title:', decision.title);
    console.log('Status:', decision.status);
    console.log('Created at:', decision.created_at);

    return decision;

  } catch (err) {
    console.log('Error:', err.message);
  }
}

createTestDecision();
