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

  const decisions = [
    {
      user_id: userId,
      title: 'UNIQUE_SEARCHABLE_TERM_XYZ - First Decision',
      description: 'This decision contains the unique searchable term for testing Feature #58',
      status: 'draft',
      created_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'Random Other Decision About Cats',
      description: 'This decision does NOT contain the searchable term',
      status: 'draft',
      created_at: new Date().toISOString()
    }
  ];

  console.log('Creating', decisions.length, 'test decisions for Feature #58 search test...');

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

  console.log('\n✅ Total decisions created:', decisions.length);
  console.log('Ready for search testing!');
}

createTestDecisions();
