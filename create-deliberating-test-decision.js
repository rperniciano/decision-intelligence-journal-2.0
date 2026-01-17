import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51'; // session35test user

  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'Test Decision for Deliberating Status - Session 35',
      description: 'This decision will transition to deliberating status',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Decision created successfully!');
    console.log('Decision ID:', data.id);
    console.log('Title:', data.title);
    console.log('Status:', data.status);
  }
}

createTestDecision();
