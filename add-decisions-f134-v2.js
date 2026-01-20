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

async function addDecisions() {
  const email = 'f134-export-1768885763202@example.com';

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  const userId = user.id;
  console.log('Found user:', userId);

  // Create decisions with correct schema
  const decisions = [
    {
      user_id: userId,
      title: 'Export Test Decision 1',
      description: 'Testing export functionality with JSON format',
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'Export Test Decision 2',
      description: 'Another test decision for export verification',
      status: 'decided',
      decided_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  for (const decision of decisions) {
    const { data: decisionData, error: decisionError } = await supabase
      .from('decisions')
      .insert(decision)
      .select();

    if (decisionError) {
      console.log('Decision error:', decisionError.message);
    } else {
      console.log('Created decision:', decisionData[0].id, '-', decisionData[0].title);
    }
  }

  console.log('\n=== READY FOR TESTING ===');
  console.log('Email:', email);
  console.log('Password: Test123456');
}

addDecisions();
