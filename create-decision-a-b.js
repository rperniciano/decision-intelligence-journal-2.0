import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecisions() {
  const userId = 'ad75f66c-2728-4325-8ad8-3d358af5e15d'; // session16test@example.com

  const decisions = [
    {
      user_id: userId,
      title: 'DECISION_A',
      description: 'This is Decision A for outcome testing',
      status: 'decided',
      detected_emotional_state: 'confident',
      category_id: 'ef3c7424-444c-497f-a642-4c93837f8e3f', // Business
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'DECISION_B',
      description: 'This is Decision B for outcome testing',
      status: 'decided',
      detected_emotional_state: 'uncertain',
      category_id: 'ef3c7424-444c-497f-a642-4c93837f8e3f', // Business
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  console.log('Creating decisions A and B...');
  const { data, error } = await supabase
    .from('decisions')
    .insert(decisions)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Decisions created successfully!');
    data.forEach(d => {
      console.log(`- ${d.title}: ${d.id}`);
    });
  }
}

createDecisions();
