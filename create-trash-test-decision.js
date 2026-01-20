const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const email = 'trash-test@example.com';

  console.log('Creating test decision for trash feature...');

  // Get user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('User not found');
    process.exit(1);
  }

  console.log('User ID:', user.id);

  // Create decision
  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'TRASH_TEST_ITEM',
      description: 'Test decision for trash feature verification',
      status: 'decided'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating decision:', error.message);
    process.exit(1);
  }

  console.log('✅ Test decision created successfully!');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Status:', decision.status);
})();
