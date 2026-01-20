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

  // Get user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ Found user:', user.id);

  const decisions = [
    {
      title: 'Test Decision 1',
      status: 'reviewed',
      category: 'Work',
      emotional_state: 'confident',
      options: JSON.stringify([
        { name: 'Option A', isChosen: true },
        { name: 'Option B', isChosen: false },
      ]),
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Test Decision 2',
      status: 'reviewed',
      category: 'Personal',
      emotional_state: 'confident',
      options: JSON.stringify([
        { name: 'Option A', isChosen: true },
        { name: 'Option B', isChosen: false },
      ]),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Test Decision 3',
      status: 'reviewed',
      category: 'Finance',
      emotional_state: 'confident',
      options: JSON.stringify([
        { name: 'Option A', isChosen: true },
        { name: 'Option B', isChosen: false },
      ]),
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Test Decision 4',
      status: 'reviewed',
      category: 'Career',
      emotional_state: 'calm',
      options: JSON.stringify([
        { name: 'Option A', isChosen: true },
        { name: 'Option B', isChosen: false },
      ]),
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Test Decision 5',
      status: 'reviewed',
      category: 'Health',
      emotional_state: 'thoughtful',
      options: JSON.stringify([
        { name: 'Option A', isChosen: true },
        { name: 'Option B', isChosen: false },
      ]),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Night Owl Decision',
      status: 'reviewed',
      category: 'Personal',
      emotional_state: 'anxious',
      options: JSON.stringify([
        { name: 'Option A', isChosen: true },
        { name: 'Option B', isChosen: false },
      ]),
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Early Bird Decision',
      status: 'reviewed',
      category: 'Work',
      emotional_state: 'calm',
      options: JSON.stringify([
        { name: 'Option A', isChosen: true },
        { name: 'Option B', isChosen: false },
      ]),
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Thorough Decision with Many Options',
      status: 'reviewed',
      category: 'Career',
      emotional_state: 'thoughtful',
      options: JSON.stringify([
        { name: 'Option 1', isChosen: true },
        { name: 'Option 2', isChosen: false },
        { name: 'Option 3', isChosen: false },
        { name: 'Option 4', isChosen: false },
      ]),
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const decision of decisions) {
    // Insert decision
    const { data: decData, error: decError } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        ...decision,
      })
      .select('id')
      .single();

    if (decError) {
      console.log('❌ Error creating decision:', decError.message);
      continue;
    }

    console.log('✅ Created decision:', decData.id, '-', decision.title);
  }

  console.log('\n✅ All test data created!');
  console.log(`Created ${decisions.length} decisions`);
  console.log('User: feature218@test.com');
  console.log('Password: test123456');
}

createTestDecisions();
