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

async function createTestUser() {
  const timestamp = Date.now();
  const email = `f134-export-${timestamp}@example.com`;
  const password = 'Test123456';

  // Create user with auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    console.log('Auth error:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log('Created user:', userId, email);
  console.log('Password:', password);

  // Create some test decisions
  const decisions = [
    {
      user_id: userId,
      title: 'Test Decision 1',
      description: 'Testing export functionality',
      category: 'career',
      status: 'pending',
      decide_by_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      options: [
        { text: 'Option A', pros: ['Pro 1'], cons: ['Con 1'] },
        { text: 'Option B', pros: ['Pro 2'], cons: ['Con 2'] }
      ]
    },
    {
      user_id: userId,
      title: 'Test Decision 2',
      description: 'Another test decision',
      category: 'personal',
      status: 'decided',
      decide_by_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      options: [
        { text: 'Option X', pros: ['Pro X'], cons: ['Con X'] }
      ],
      outcome: {
        selected_option_index: 0,
        satisfaction: 4,
        notes: 'Good decision'
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
      console.log('Created decision:', decisionData[0].id);
    }
  }

  console.log('\n=== TEST USER CREATED ===');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Decisions created:', decisions.length);
}

createTestUser();
