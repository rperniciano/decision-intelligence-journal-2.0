const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestReminder() {
  // Use the existing test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.log('❌ No users found');
    return;
  }

  const user = users[0];
  console.log('Using user:', user.email);

  const decisionId = '44ff1899-d48b-476c-ab48-26bec1a5a3f7';

  // Create a reminder for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const reminderData = {
    decision_id: decisionId,
    user_id: user.id,
    remind_at: tomorrow.toISOString(),
    status: 'pending'
  };

  console.log('Inserting reminder:', reminderData);

  const { data, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert(reminderData)
    .select();

  if (error) {
    console.log('❌ Error creating reminder:', error.message);
    console.log('Error details:', error);
    return;
  }

  console.log('✅ Created reminder:', data[0].id);
  console.log('Reminder time:', tomorrow.toLocaleString());
}

createTestReminder().then(() => process.exit(0));
