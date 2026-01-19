/**
 * Create test decisions for Feature #269 testing
 * This will give us data to work with for testing late API responses
 */
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDecisions() {
  try {
    console.log('Creating test decisions for Feature #269...');

    // First, get the session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test_f269@example.com',
      password: 'testpass123',
    });

    if (signInError) {
      throw signInError;
    }

    const userId = signInData.user.id;
    const token = signInData.session.access_token;

    console.log('✓ Logged in as user:', userId);

    // Create 5 test decisions
    const decisions = [
      {
        title: 'Test Decision F269-1',
        status: 'decided',
        category: 'Career',
        emotional_state: 'Anxious but hopeful',
        options: [
          {
            id: `opt-${Date.now()}-1`,
            text: 'Option A: Stay at current job',
            pros: ['Stable income', 'Know the team'],
            cons: ['Limited growth', 'Lower salary'],
            is_chosen: true,
          },
          {
            id: `opt-${Date.now()}-2`,
            text: 'Option B: Join new startup',
            pros: ['Higher salary', 'Growth potential'],
            cons: ['Risky', 'Unknown culture'],
            is_chosen: false,
          },
        ],
        notes: 'Test decision for Feature #269 - late response testing',
      },
      {
        title: 'Test Decision F269-2',
        status: 'decided',
        category: 'Health',
        emotional_state: 'Determined',
        options: [
          {
            id: `opt-${Date.now()}-3`,
            text: 'Option A: Morning workout routine',
            pros: ['More energy', 'Consistent schedule'],
            cons: ['Wake up earlier', 'Less sleep time'],
            is_chosen: true,
          },
          {
            id: `opt-${Date.now()}-4`,
            text: 'Option B: Evening workout routine',
            pros: ['Relaxing', 'More flexible'],
            cons: ['Can be skipped', 'Tired after work'],
            is_chosen: false,
          },
        ],
        notes: 'Test decision for Feature #269',
      },
    ];

    const apiUrl = 'http://localhost:3001/api/v1';

    for (let i = 0; i < decisions.length; i++) {
      const decision = decisions[i];

      console.log(`\nCreating decision ${i + 1}/${decisions.length}:`, decision.title);

      const response = await fetch(`${apiUrl}/decisions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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

    console.log('\n✓ Test decisions created successfully');

  } catch (error) {
    console.error('Error creating test decisions:', error);
    throw error;
  }
}

createTestDecisions()
  .then(() => {
    console.log('\nTest data setup complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nFailed to create test data');
    process.exit(1);
  });
