import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addTestDecision() {
  const email = 'f10-logout-test-1768886783687@example.com';

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  const userId = user.id;
  console.log('Found user:', userId);

  // Create a test decision for soft delete/restore testing
  const decision = {
    user_id: userId,
    title: 'Test Decision for Soft Delete/Restore - F96',
    description: 'This is a test decision to verify Feature #96: Restore soft-deleted decision. It should be soft deleted, moved to trash, then restored with all data intact.',
    status: 'draft',
    created_at: new Date().toISOString()
  };

  const { data: decisionData, error: decisionError } = await supabase
    .from('decisions')
    .insert(decision)
    .select();

  if (decisionError) {
    console.log('Decision error:', decisionError.message);
  } else {
    console.log('Created test decision for Feature #96:');
    console.log('  ID:', decisionData[0].id);
    console.log('  Title:', decisionData[0].title);
    console.log('  Description:', decisionData[0].description);
    console.log('\nReady for soft delete/restore testing.');
  }
}

addTestDecision();
