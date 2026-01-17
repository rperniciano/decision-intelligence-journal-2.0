const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  try {
    // Get the session60test user
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    const user = userData.users.find(u => u.email === 'session60test@example.com');
    if (!user) {
      console.log('User not found');
      return;
    }

    // Create a decision
    const { data, error } = await supabase
      .from('decisions')
      .insert([
        {
          user_id: user.id,
          title: 'REGRESSION_49_TEST_DECISION',
          status: 'decided',
          description: 'This decision will be soft deleted to test trash view'
        }
      ])
      .select();

    if (error) throw error;
    console.log('Decision created:', data[0].id);
    console.log('Title:', data[0].title);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestDecision();
