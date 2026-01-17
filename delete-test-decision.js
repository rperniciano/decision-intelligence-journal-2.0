import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteTestDecision() {
  const titleToDelete = 'DELETE_TEST_1768610502728';

  // Soft delete by setting deleted_at timestamp
  const { data, error } = await supabase
    .from('decisions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('title', titleToDelete)
    .eq('user_id', '94bd67cb-b094-4387-a9c8-26b0c65904cd')
    .select();

  if (error) {
    console.error('Error deleting decision:', error);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('Decision soft-deleted successfully!');
    console.log('Decision ID:', data[0].id);
    console.log('Title:', data[0].title);
    console.log('Deleted at:', data[0].deleted_at);
  } else {
    console.log('No decision found with that title');
  }
}

deleteTestDecision();
