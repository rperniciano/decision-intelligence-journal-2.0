import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestDecision() {
  try {
    // Get mobiletest user
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find(u => u.email === 'mobiletest@example.com');

    if (!testUser) {
      console.error('Test user not found');
      process.exit(1);
    }

    console.log('Creating decision for user:', testUser.email);

    // Create decision with exact title specified in test
    const decision = {
      user_id: testUser.id,
      title: 'PERSIST_TEST_789',
      status: 'decided',
      detected_emotional_state: 'confident',
      description: 'This decision tests persistence across logout/login sessions',
      decided_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select()
      .single();

    if (error) {
      console.error('Error creating decision:', error);
      process.exit(1);
    }

    console.log('✅ Decision created successfully!');
    console.log('ID:', data.id);
    console.log('Title:', data.title);
    console.log('Status:', data.status);
    console.log('\n🔍 Look for this exact title after logout/login:');
    console.log(`   "${data.title}"`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestDecision();
