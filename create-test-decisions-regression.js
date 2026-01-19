import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDecisions() {
  const userId = 'bf60eb9b-2d14-48ca-bb05-89426861cb17'; // regression-test@example.com

  const decisions = [
    {
      user_id: userId,
      title: 'Should I learn React?',
      description: 'Deciding between React and Vue for frontend development'
    },
    {
      user_id: userId,
      title: 'Buy a new laptop!',
      description: 'Need to upgrade my old computer for work'
    },
    {
      user_id: userId,
      title: 'Special chars test: @#$%',
      description: 'Testing decision with special characters in title'
    }
  ];

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select();

    if (error) {
      console.log('Error inserting decision:', error.message);
    } else {
      console.log('Created decision:', data[0].title, '- ID:', data[0].id);
    }
  }
}

createTestDecisions();
