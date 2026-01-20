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

async function addTestDecisions() {
  const email = 'f147-regression-test@example.com';

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  const userId = user.id;
  console.log('Found user:', userId);

  // Create test decisions with different statuses
  const decisions = [
    {
      user_id: userId,
      title: 'F147_TEST_1: Job Offer Decision',
      description: 'I need to decide between two job offers. Company A offers more money but Company B has better work-life balance.',
      status: 'decided'
    },
    {
      user_id: userId,
      title: 'F147_TEST_2: Moving to New City',
      description: 'Should I move to San Francisco for a new opportunity? The rent is high but the career growth is excellent.',
      status: 'in_progress'
    },
    {
      user_id: userId,
      title: 'F147_TEST_3: Buying a Car',
      description: 'Trying to decide between buying a Tesla Model 3 or a BMW 3 Series. Tesla is cheaper to run but BMW has better handling.',
      status: 'decided'
    },
    {
      user_id: userId,
      title: 'F147_TEST_4: Learning New Skill',
      description: 'Should I learn Python or JavaScript first? Python is better for data science but JavaScript is more versatile for web development.',
      status: 'in_progress'
    },
    {
      user_id: userId,
      title: 'F147_TEST_5: Vacation Planning',
      description: 'Planning annual vacation. Hawaii is beautiful but expensive. Mexico is affordable and has great culture.',
      status: 'decided'
    }
  ];

  console.log('Creating test decisions...');

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select();

    if (error) {
      console.error('Error creating decision:', error.message);
    } else {
      console.log('✓ Created:', decision.title, '- Status:', decision.status);
    }
  }

  console.log('\nTest decisions created successfully!');
}

addTestDecisions();
