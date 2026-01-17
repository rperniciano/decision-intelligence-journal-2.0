const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecision() {
  // Get user ID
  const { data: userData } = await supabase.auth.admin.listUsers();
  const user = userData.users.find(u => u.email === 'session58verified@example.com');

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Creating decision for user:', user.id);

  // Create decision with title
  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'REGRESSION_63_TIMESTAMP_TEST',
      description: 'Test decision to verify timestamps are accurate',
      status: 'draft'
    })
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Decision created successfully!');
    console.log('ID:', data.id);
    console.log('Created at:', data.created_at);
    console.log('Title:', data.title);
  }
}

createDecision();
