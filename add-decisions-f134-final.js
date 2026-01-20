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

  // Create decisions with valid status values
  const decisions = [
    {
      user_id: userId,
      title: 'Export Test Decision - Draft',
      description: 'Testing draft status for export',
      status: 'draft',
      created_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'Export Test Decision - In Progress',
      description: 'Testing in_progress status for export',
      status: 'in_progress',
      created_at: new Date().toISOString()
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
  console.log('Total decisions ready for export');
}

addDecisions();
