// Cleanup test data for Feature #211

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
  console.log('=== Cleaning up Feature #211 test data ===\n');

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'f211.positionbias@example.com');

  if (!testUser) {
    console.log('Test user not found (may already be cleaned up)');
    return;
  }

  // Delete decisions (cascade should delete options)
  const { error } = await supabase
    .from('decisions')
    .delete()
    .eq('user_id', testUser.id)
    .ilike('title', 'F211 Pos Bias%');

  if (error) {
    console.error('Error deleting decisions:', error);
  } else {
    console.log('✅ Deleted test decisions');
  }

  // Delete the test user
  const { error: deleteError } = await supabase.auth.admin.deleteUser(testUser.id);

  if (deleteError) {
    console.error('Error deleting user:', deleteError);
  } else {
    console.log('✅ Deleted test user');
  }

  console.log('\nCleanup complete!');
}

cleanup().catch(console.error);
