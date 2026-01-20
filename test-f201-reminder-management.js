import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testEmail = `test-f201-${Date.now()}@example.com`;
const testPassword = 'test123456';

async function createTestData() {
  console.log('Creating test user and data for Feature #201...');

  // Create user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });

  if (userError) {
    console.error('Error creating user:', userError);
    return;
  }

  const userId = userData.user.id;
  console.log('✅ Created user:', testEmail);

  const decisionId = randomUUID();

  // Create a decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      id: decisionId,
      user_id: userId,
      title: 'Test Decision F201 - Reminder Management',
      status: 'decided',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✅ Created decision:', decision.id);

  // Create reminders with different statuses
  const now = new Date();
  const pastDate = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
  const futureDate = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 24 hours from now
  const futureDate2 = new Date(now.getTime() + 1000 * 60 * 60 * 48); // 48 hours from now

  const reminders = [
    {
      decision_id: decision.id,
      user_id: userId,
      remind_at: pastDate.toISOString(),
      status: 'pending',
    },
    {
      decision_id: decision.id,
      user_id: userId,
      remind_at: futureDate.toISOString(),
      status: 'pending',
    },
    {
      decision_id: decision.id,
      user_id: userId,
      remind_at: futureDate2.toISOString(),
      status: 'pending',
    },
  ];

  const { data: createdReminders, error: remindersError } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert(reminders)
    .select();

  if (remindersError) {
    console.error('Error creating reminders:', remindersError);
    return;
  }

  console.log('✅ Created 3 reminders');
  console.log('\nTest data created successfully!');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  console.log('Decision ID:', decision.id);
  console.log('Reminder IDs:', createdReminders.map(r => r.id));
  console.log('\nNavigate to: http://localhost:5173/decisions/' + decision.id);
}

createTestData().catch(console.error);
