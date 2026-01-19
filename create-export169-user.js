const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function createExportTestUser() {
  // Create user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'export169@test.com',
    password: 'test123456',
  });

  if (authError && !authError.message.includes('already registered')) {
    console.log('Auth error:', authError.message);
    return;
  }

  // Get user ID
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: 'export169@test.com',
    password: 'test123456',
  });

  if (!user) {
    console.log('Could not get user');
    return;
  }

  const userId = user.id;
  console.log('User ID:', userId);

  // Check if decisions already exist
  const { data: existing } = await supabase
    .from('decisions')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('User already has decisions, skipping creation');
    return;
  }

  // Create a few test decisions
  const decisions = [
    {
      user_id: userId,
      title: 'Career Move Decision',
      description: 'Choosing between two job offers',
      context: 'Both offers have good salary and benefits',
      options: [
        { title: 'Company A', pros: ['Higher salary', 'Better location'], cons: ['Longer hours', 'Less stability'] },
        { title: 'Company B', pros: ['Better work-life balance', 'Remote option'], cons: ['Lower salary', 'Smaller team'] }
      ],
      emotional_state: 'Anxious but hopeful',
      status: 'pending',
      decided_by_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: userId,
      title: 'Apartment Rental',
      description: 'Deciding on an apartment',
      context: 'Need to move by next month',
      options: [
        { title: 'Downtown', pros: ['Close to work', 'Many amenities'], cons: ['Expensive', 'Noisy'] },
        { title: 'Suburbs', pros: ['Quiet', 'More space'], cons: ['Long commute', 'Less to do'] }
      ],
      emotional_state: 'Stressed',
      status: 'pending',
    },
    {
      user_id: userId,
      title: 'Learning New Skill',
      description: 'What to learn next',
      context: 'Want to advance career',
      options: [
        { title: 'Machine Learning', pros: ['High demand', 'Interesting'], cons: ['Difficult', 'Time-consuming'] },
        { title: 'Cloud Architecture', pros: ['Practical', 'Good pay'], cons: ['Less creative'] }
      ],
      emotional_state: 'Excited',
      status: 'pending',
    }
  ];

  const { data: insertedDecisions, error: insertError } = await supabase
    .from('decisions')
    .insert(decisions)
    .select();

  if (insertError) {
    console.log('Insert error:', insertError.message);
  } else {
    console.log('Created', insertedDecisions.length, 'decisions for export testing');
  }
}

createExportTestUser();
