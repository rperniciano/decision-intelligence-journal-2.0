import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createNonMatchingDecision() {
  const mobileTestUserId = '94bd67cb-b094-4387-a9c8-26b0c65904cd';

  const { data, error } = await supabase
    .from('decisions')
    .insert([
      {
        user_id: mobileTestUserId,
        title: 'DIFFERENT_TITLE_NO_MATCH',
        description: 'This decision should NOT be found in search for UNIQUE_SEARCHABLE_TERM',
        status: 'decided',
        detected_emotional_state: 'confident',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    console.error('Error creating decision:', error);
    process.exit(1);
  }

  console.log('Created non-matching decision:', data[0]);
  console.log('Title:', data[0].title);
  console.log('ID:', data[0].id);
}

createNonMatchingDecision();
