// Create test decision with reminder for feature #173 testing
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: '.env' });

async function createTestData() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get test user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'testf173@example.com');

  if (!testUser) {
    console.log('❌ Test user not found');
    return;
  }

  const decisionId = randomUUID();

  // 1. Create a decision
  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .insert({
      id: decisionId,
      user_id: testUser.id,
      title: 'Test Decision F173 - Cascade Delete',
      status: 'decided',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decError) {
    console.log('❌ Error creating decision:', decError.message);
    return;
  }

  console.log('✅ Created decision:', decision.id);

  // 2. Create a reminder directly
  const reminderDate = new Date();
  reminderDate.setDate(reminderDate.getDate() + 14); // 2 weeks from now

  const { data: reminder, error: remError } = await supabase
    .from('outcome_reminders')
    .insert({
      decision_id: decisionId,
      user_id: testUser.id,
      remind_at: reminderDate.toISOString(),
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (remError) {
    console.log('❌ Error creating reminder:', remError.message);
    return;
  }

  console.log('✅ Created reminder:', reminder.id);
  console.log('\n=== Test Data Created ===');
  console.log('Decision ID:', decision.id);
  console.log('Reminder ID:', reminder.id);
  console.log('Reminder Status:', reminder.status);
  console.log('\nNow you can test deleting the decision via the UI');
}

createTestData().catch(console.error);
