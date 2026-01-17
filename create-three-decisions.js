import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = '94bd67cb-b094-4387-a9c8-26b0c65904cd'; // mobiletest user

async function createDecisions() {
  const timestamp = Date.now();

  for (let i = 1; i <= 3; i++) {
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: `STATS_TEST_${timestamp}_${i}`,
        description: `Test decision ${i} for statistics verification`,
        status: 'decided',
        detected_emotional_state: 'confident',
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating decision ${i}:`, error);
    } else {
      console.log(`✓ Created decision ${i}: ${data.title} (ID: ${data.id})`);
    }
  }
}

createDecisions();
