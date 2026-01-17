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

    // Create decision directly via Supabase
    const decision = {
      user_id: testUser.id,
      title: 'TEST_UNIQUE_12345',
      status: 'decided',
      detected_emotional_state: 'confident',
      description: 'This is a test decision created to verify real data persistence',
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

    console.log('Decision created successfully!');
    console.log('ID:', data.id);
    console.log('Title:', data.title);
    console.log('Status:', data.status);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestDecision();
