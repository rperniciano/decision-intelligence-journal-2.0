import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupTestData() {
  console.log('Cleaning up test data for Feature #21...');

  // Get the test users
  const { data: { users } } = await supabase.auth.admin.listUsers();

  const testUserA = users.find(u => u.email === 'feature21-usera@example.com');
  const testUserB = users.find(u => u.email === 'feature21-userb@example.com');

  if (testUserA) {
    // Delete User A's decisions
    const { error: deleteDecisionsA } = await supabase
      .from('decisions')
      .delete()
      .eq('user_id', testUserA.id);
    if (deleteDecisionsA) {
      console.error('Error deleting User A decisions:', deleteDecisionsA);
    } else {
      console.log('✓ Deleted User A decisions');
    }

    // Delete User A
    const { error: deleteUserA } = await supabase.auth.admin.deleteUser(testUserA.id);
    if (deleteUserA) {
      console.error('Error deleting User A:', deleteUserA);
    } else {
      console.log('✓ Deleted User A');
    }
  }

  if (testUserB) {
    // Delete User B's decisions
    const { error: deleteDecisionsB } = await supabase
      .from('decisions')
      .delete()
      .eq('user_id', testUserB.id);
    if (deleteDecisionsB) {
      console.error('Error deleting User B decisions:', deleteDecisionsB);
    } else {
      console.log('✓ Deleted User B decisions');
    }

    // Delete User B
    const { error: deleteUserB } = await supabase.auth.admin.deleteUser(testUserB.id);
    if (deleteUserB) {
      console.error('Error deleting User B:', deleteUserB);
    } else {
      console.log('✓ Deleted User B');
    }
  }

  console.log('✓ Cleanup complete');
}

cleanupTestData().catch(console.error);
