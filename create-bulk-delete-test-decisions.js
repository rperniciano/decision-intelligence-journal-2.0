const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestDecisions() {
  try {
    // Sign in as test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'session35test@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('✅ Signed in as session35test@example.com');

    // Get user ID
    const userId = authData.user.id;
    console.log('User ID:', userId);

    // Create 3 test decisions
    const decisions = [
      {
        user_id: userId,
        title: 'BULK_DELETE_TEST_1_SESSION42',
        status: 'in_progress',
        category: 'Personal',
        created_at: new Date().toISOString()
      },
      {
        user_id: userId,
        title: 'BULK_DELETE_TEST_2_SESSION42',
        status: 'in_progress',
        category: 'Personal',
        created_at: new Date().toISOString()
      },
      {
        user_id: userId,
        title: 'BULK_DELETE_TEST_3_SESSION42',
        status: 'in_progress',
        category: 'Personal',
        created_at: new Date().toISOString()
      }
    ];

    for (const decision of decisions) {
      const { data, error } = await supabase
        .from('decisions')
        .insert([decision])
        .select()
        .single();

      if (error) {
        console.error('Error creating decision:', decision.title, error);
      } else {
        console.log(`✅ Created: ${data.title} (ID: ${data.id})`);
      }
    }

    console.log('\n✅ All 3 test decisions created successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestDecisions();
