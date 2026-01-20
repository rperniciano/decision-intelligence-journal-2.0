// Confirm existing test user for feature #173 testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmTestUser() {
  try {
    // List users to find the user ID
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) throw error;

    const testUser = users.find(u => u.email === 'testf173@example.com');

    if (!testUser) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', testUser.id);

    // Update user to confirm email
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      testUser.id,
      {
        email_confirm: true
      }
    );

    if (updateError) throw updateError;

    console.log('✓ User email confirmed');
    console.log('✓ Email confirmed at:', updateData.user.email_confirmed_at);

    // Ensure profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', testUser.id)
      .single();

    if (!profile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testUser.id,
          name: 'Test User F173',
          decision_score: 50,
          total_decisions: 0,
          positive_outcome_rate: 0
        });

      if (profileError) {
        console.log('Profile creation error:', profileError.message);
      } else {
        console.log('✓ Profile created');
      }
    } else {
      console.log('✓ Profile already exists');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

confirmTestUser();
