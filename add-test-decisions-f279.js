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

async function createTestDecisions() {
  const email = 'f279-test-1768901380856@example.com';

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  const userId = user.id;
  console.log('Found user:', userId);

  const decisions = [
    {
      user_id: userId,
      title: 'F279 Test - Career Decision 1',
      description: 'Testing export with category filter - Career 1',
      status: 'draft',
      created_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'F279 Test - Career Decision 2',
      description: 'Testing export with category filter - Career 2',
      status: 'draft',
      created_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'F279 Test - Health Decision',
      description: 'Testing export with category filter - Health',
      status: 'draft',
      created_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'F279 Test - Financial Decision',
      description: 'Testing export with category filter - Financial',
      status: 'draft',
      created_at: new Date().toISOString()
    }
  ];

  console.log('Creating', decisions.length, 'test decisions for Feature #279...');

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select();

    if (error) {
      console.error('Error creating decision:', error.message);
    } else {
      console.log('✅ Created:', decision.title, '(ID:', data[0].id + ')');
    }
  }

  console.log('\n✅ Total decisions created: 4');
  console.log('Ready for export filter testing!');
}

createTestDecisions();
