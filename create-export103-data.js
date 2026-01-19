/**
 * Create test data for Feature #103 (CSV Export) testing
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiUrl = 'http://localhost:4013';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createExportTestData() {
  try {
    console.log('Creating test data for Feature #103 (CSV Export)...');

    const email = 'export103@test.com';
    const password = 'test123456';

    // Sign in to get token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw signInError;
    }

    const userId = signInData.user.id;
    const token = signInData.session.access_token;

    console.log('✓ Logged in as user:', userId);

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

    // Create test decisions via API
    const decisions = [
      {
        title: 'Career Move Decision',
        status: 'pending',
        category: 'Career',
        emotional_state: 'Anxious but hopeful',
        options: [
          {
            text: 'Company A',
            pros: ['Higher salary', 'Better location'],
            cons: ['Longer hours', 'Less stability'],
          },
          {
            text: 'Company B',
            pros: ['Better work-life balance', 'Remote option'],
            cons: ['Lower salary', 'Smaller team'],
          },
        ],
        notes: 'Choosing between two job offers with different trade-offs',
      },
      {
        title: 'Apartment Rental',
        status: 'decided',
        category: 'Housing',
        emotional_state: 'Stressed',
        options: [
          {
            text: 'Downtown Apartment',
            pros: ['Close to work', 'Many amenities'],
            cons: ['Expensive', 'Noisy'],
            is_chosen: true,
          },
          {
            text: 'Suburban House',
            pros: ['Quiet', 'More space'],
            cons: ['Long commute', 'Less to do'],
            is_chosen: false,
          },
        ],
        notes: 'Need to move by next month',
      },
      {
        title: 'Learning New Skill',
        status: 'pending',
        category: 'Education',
        emotional_state: 'Excited',
        options: [
          {
            text: 'Machine Learning',
            pros: ['High demand', 'Interesting'],
            cons: ['Difficult', 'Time-consuming'],
          },
          {
            text: 'Cloud Architecture',
            pros: ['Practical', 'Good pay'],
            cons: ['Less creative'],
          },
        ],
        notes: 'Want to advance career and stay relevant',
      },
    ];

    for (let i = 0; i < decisions.length; i++) {
      const decision = decisions[i];

      console.log(`\nCreating decision ${i + 1}/${decisions.length}:`, decision.title);

      const response = await fetch(`${apiUrl}/api/v1/decisions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(decision),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to create decision:', error);
        continue;
      }

      const data = await response.json();
      console.log('✓ Created decision:', data.id);
    }

    console.log('\n✓ Test data created successfully for CSV export testing');

  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
}

createExportTestData()
  .then(() => {
    console.log('\nTest data setup complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nFailed to create test data');
    process.exit(1);
  });
