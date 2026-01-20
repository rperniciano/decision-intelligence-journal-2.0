import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDecisions() {
  const email = 'feature218@test.com';

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ Found user:', user.id);

  const decisions = [
    { title: 'Test Decision 1', status: 'decided', outcome: 'better', detected_emotional_state: 'confident', hour_of_day: 10, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { title: 'Test Decision 2', status: 'decided', outcome: 'better', detected_emotional_state: 'confident', hour_of_day: 14, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { title: 'Test Decision 3', status: 'decided', outcome: 'better', detected_emotional_state: 'confident', hour_of_day: 16, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { title: 'Test Decision 4', status: 'decided', outcome: 'better', detected_emotional_state: 'calm', hour_of_day: 11, created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { title: 'Test Decision 5', status: 'decided', outcome: 'better', detected_emotional_state: 'happy', hour_of_day: 9, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { title: 'Night Owl Decision', status: 'decided', outcome: 'as_expected', detected_emotional_state: 'anxious', hour_of_day: 2, created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
    { title: 'Early Bird Decision', status: 'decided', outcome: 'better', detected_emotional_state: 'calm', hour_of_day: 6, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        ...decision,
      })
      .select('id')
      .single();

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Created:', decision.title, 'at hour', decision.hour_of_day);
    }
  }

  console.log('\n✅ Done!');
}

createTestDecisions();
