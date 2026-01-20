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
  const password = 'Test123456';

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  const userId = user.id;
  console.log('Found user:', userId);

  // Create decisions without category
  const decisions = [
    {
      user_id: userId,
      title: 'Export Test Decision 1',
      description: 'Testing export functionality with JSON format',
      status: 'pending',
      decide_by_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      options: [
        { text: 'Option A', pros: ['Pro 1', 'Pro 2'], cons: ['Con 1'] },
        { text: 'Option B', pros: ['Pro 3'], cons: ['Con 2', 'Con 3'] }
      ]
    },
    {
      user_id: userId,
      title: 'Export Test Decision 2',
      description: 'Another test decision for export',
      status: 'decided',
      decide_by_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      options: [
        { text: 'Option X', pros: ['Pro X'], cons: ['Con X'] }
      ],
      outcome: {
        selected_option_index: 0,
        satisfaction: 4,
        notes: 'Good decision outcome'
      }
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
  console.log('Password:', password);
}

addDecisions();
