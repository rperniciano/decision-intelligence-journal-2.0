import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDeletion() {
  const decisionId = 'd788b16d-dc39-4c54-b87b-c8ab5d4ebbb1';

  // Check with deleted_at filter removed to see if it's soft deleted
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, deleted_at')
    .eq('id', decisionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('✅ Decision not found in database (hard deleted or soft deleted with RLS)');
    } else {
      console.error('Error:', error);
    }
  } else {
    if (data.deleted_at) {
      console.log('✅ Decision soft deleted successfully');
      console.log('Decision ID:', data.id);
      console.log('Deleted at:', data.deleted_at);
    } else {
      console.log('❌ Decision still exists and is not deleted');
      console.log('Decision:', data);
    }
  }
}

verifyDeletion();
