// Create test user for feature #173 testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  try {
    // Create user with emailConfirmed = true
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'testf173@example.com',
      password: 'testpass123',
      email_confirm: true,
      user_metadata: {
        name: 'Test User F173'
      }
    });

    if (error) throw error;

    console.log('✓ User created:', data.user.id);
    console.log('✓ Email:', data.user.email);
    console.log('✓ Confirmed:', data.user.email_confirmed_at);

    // Create profile entry
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        name: 'Test User F173',
        decision_score: 50,
        total_decisions: 0,
        positive_outcome_rate: 0
      });

    if (profileError) {
      console.log('Profile might already exist or error:', profileError.message);
    } else {
      console.log('✓ Profile created');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

createTestUser();
