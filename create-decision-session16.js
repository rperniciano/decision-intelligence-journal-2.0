import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecision() {
  const userId = 'ad75f66c-2728-4325-8ad8-3d358af5e15d'; // session16test@example.com

  const decision = {
    user_id: userId,
    title: 'REGRESSION_TEST_DECISION_1',
    description: 'This is a test decision for regression testing',
    status: 'decided',
    detected_emotional_state: 'confident',
    category_id: 'ef3c7424-444c-497f-a642-4c93837f8e3f', // Business category
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('Creating decision...');
  const { data, error } = await supabase
    .from('decisions')
    .insert([decision])
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Decision created successfully!');
    console.log('ID:', data[0].id);
    console.log('Title:', data[0].title);
  }
}

createDecision();
