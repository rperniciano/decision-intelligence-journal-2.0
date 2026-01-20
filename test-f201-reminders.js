// Script to create test user and reminders for Feature #201 testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  const userEmail = 'f201-test-reminder@example.com';
  const password = 'test123456';

  console.log('Creating test user and reminders for Feature #201...');

  // Check if user exists, create if not
  let user;
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  user = users.find(u => u.email === userEmail);

  if (!user) {
    console.log('Creating new user...');
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: password,
      email_confirm: true,
      user_metadata: { name: 'F201 Test User' }
    });

    if (createError) {
      console.error('Error creating user:', createError.message);
      return;
    }
    user = userData.user;
  }

  console.log('✓ User ID:', user.id);
  console.log('✓ Email:', userEmail);
  console.log('✓ Password:', password);

  // Create a test decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'F201 Test Decision - Reminder Management Test',
      status: 'decided',
      decided_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError.message);
    return;
  }

  console.log('✓ Decision created:', decision.id);

  // Create reminders with different dates for testing
  const now = new Date();
  const reminders = [
    {
      decision_id: decision.id,
      user_id: user.id,
      remind_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday - due
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      decision_id: decision.id,
      user_id: user.id,
      remind_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow - upcoming
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      decision_id: decision.id,
      user_id: user.id,
      remind_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago - overdue
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  for (const reminder of reminders) {
    const { data, error } = await supabase
      .from('DecisionsFollowUpReminders')
      .insert(reminder)
      .select();

    if (error) {
      console.error(`Error creating reminder:`, error.message);
    } else {
      console.log(`✓ Created reminder for: ${reminder.remind_at}`);
    }
  }

  console.log('\n✅ Test data created successfully!');
  console.log('\nYou can now log in with:');
  console.log(`  Email: ${userEmail}`);
  console.log(`  Password: ${password}`);
  console.log('\nThen navigate to the decision details to test reminder management:');
  console.log('  - Reschedule reminders');
  console.log('  - Skip reminders');
  console.log('  - Complete reminders');
  console.log('  - Delete reminders');
}

createTestData().catch(console.error);
