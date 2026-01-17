import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraints() {
  try {
    // Query PostgreSQL information schema for foreign keys
    const { data, error } = await supabase.rpc('get_foreign_keys', {});

    if (error) {
      console.log('RPC not available, trying direct query...');

      // Try a simpler approach - attempt to delete an option and see what happens
      console.log('\nAttempting to delete decision to test cascade behavior...');

      // This will only work if we have a test decision
      const testDecisionId = '8a905612-4251-4b15-8cbd-dc99b4b63cdd';

      // Try to hard delete the decision
      const { error: deleteError } = await supabase
        .from('decisions')
        .delete()
        .eq('id', testDecisionId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
      } else {
        console.log('Decision deleted successfully');

        // Check if options were also deleted
        const { data: options } = await supabase
          .from('options')
          .select('id')
          .eq('decision_id', testDecisionId);

        console.log('Remaining options:', options?.length || 0);
      }
    } else {
      console.log('Foreign keys:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkConstraints();
