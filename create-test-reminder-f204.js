// Feature #204: Create a test decision with due reminder
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTestDecisionWithReminder() {
  try {
    // First, get the user ID from auth
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === 'test204@example.com');

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User ID:', user.id);

    // Create a decision with status 'decided' and a past follow_up_date
    const now = new Date();
    const pastDate = new Date(now.getTime() - 60000); // 1 minute ago

    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        title: 'Test Decision F204 - Background Job Test',
        status: 'decided',
        decided_at: new Date().toISOString(),
        follow_up_date: pastDate.toISOString(), // Due 1 minute ago
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (decisionError) {
      console.log('Error creating decision:', decisionError.message);
      return;
    }

    console.log('Decision created:', decision.id);

    // Create a reminder that's due
    const { data: reminder, error: reminderError } = await supabase
      .from('DecisionsFollowUpReminders')
      .insert({
        decision_id: decision.id,
        user_id: user.id,
        remind_at: pastDate.toISOString(), // Due 1 minute ago
        status: 'pending'
      })
      .select()
      .single();

    if (reminderError) {
      console.log('Error creating reminder:', reminderError.message);
      return;
    }

    console.log('Reminder created:', reminder.id);
    console.log('Reminder due at:', reminder.remind_at);
    console.log('Current time:', new Date().toISOString());
    console.log('\\nTest data ready! The background job should process this reminder within 1 minute.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestDecisionWithReminder();
