import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteDecision() {
  // Soft delete the first STATS_TEST decision
  const { data, error } = await supabase
    .from('decisions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('title', 'STATS_TEST_1768611646367_1')
    .select()
    .single();

  if (error) {
    console.error('Error deleting decision:', error);
  } else {
    console.log('✓ Soft deleted decision:', data.title);
  }
}

deleteDecision();
