// Simple script to create a test decision directly in Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function main() {
  // Login as test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testdev@example.com',
    password: 'testpass123',
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  console.log('✓ Logged in as', authData.user.email);

  // Create a test decision
  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: authData.user.id,
      title: 'Test Decision for Modal Testing',
      status: 'decided',
      emotional_state: 'Confident',
      notes: 'This is a test decision created to verify the delete modal functionality.',
      options: [
        {
          id: '1',
          text: 'Option A',
          pros: ['Pro 1', 'Pro 2'],
          cons: ['Con 1'],
          isChosen: true
        },
        {
          id: '2',
          text: 'Option B',
          pros: ['Pro 1'],
          cons: ['Con 1', 'Con 2']
        }
      ]
    })
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
    return;
  }

  console.log('✓ Created decision:', data.id);
  console.log('  Title:', data.title);
  console.log('  Status:', data.status);
  console.log('  URL: http://localhost:5176/decisions/' + data.id);
}

main().catch(console.error);
