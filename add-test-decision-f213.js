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
  const email = 'feature24-test-1737381234@example.com';

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  const userId = user.id;
  console.log('Found user:', userId);

  // Create a test decision for satisfaction rating testing
  const decision = {
    user_id: userId,
    title: 'Test Decision for Satisfaction Rating - F213',
    description: 'This is a test decision to verify Feature #213: Satisfaction rating within range. Testing that satisfaction rating is constrained to 1-5.',
    status: 'decided',
    created_at: new Date().toISOString()
  };

  const { data: decisionData, error: decisionError } = await supabase
    .from('decisions')
    .insert(decision)
    .select();

  if (decisionError) {
    console.log('Decision error:', decisionError.message);
  } else {
    console.log('Created test decision for Feature #213:');
    console.log('  ID:', decisionData[0].id);
    console.log('  Title:', decisionData[0].title);
    console.log('  Status:', decisionData[0].status);
    console.log('\nReady for satisfaction rating testing at:');
    console.log(`  http://localhost:5173/decisions/${decisionData[0].id}`);
  }
}

addTestDecision();
