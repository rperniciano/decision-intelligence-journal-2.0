const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc'
);

async function addTestDecisions() {
  const email = 'feature46-test-1768908020276@example.com';

  // First get the user
  const { data: { user }, error: userError } = await supabase.auth.signInWithPassword({
    email: email,
    password: 'password123'
  });

  if (userError) {
    console.error('Error signing in:', userError.message);
    process.exit(1);
  }

  console.log('Signed in as:', user.email);
  console.log('User ID:', user.id);

  // Create test decisions
  const decisions = [
    {
      user_id: user.id,
      title: 'Test Decision 1 - Feature 46',
      context: 'Testing pattern navigation',
      emotional_state: 'Calm',
      category: 'Work',
      options: [
        { text: 'Option A', position: 1 },
        { text: 'Option B', position: 2 }
      ],
      chosen_option_id: null, // Will be set after insert
      outcome: 'Positive',
      outcome_notes: 'Worked out well',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    },
    {
      user_id: user.id,
      title: 'Test Decision 2 - Feature 46',
      context: 'Testing pattern navigation with different emotion',
      emotional_state: 'Excited',
      category: 'Personal',
      options: [
        { text: 'Option A', position: 1 },
        { text: 'Option B', position: 2 },
        { text: 'Option C', position: 3 }
      ],
      chosen_option_id: null,
      outcome: 'Positive',
      outcome_notes: 'Great result',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    },
    {
      user_id: user.id,
      title: 'Test Decision 3 - Feature 46',
      context: 'Testing with negative outcome',
      emotional_state: 'Anxious',
      category: 'Work',
      options: [
        { text: 'Option A', position: 1 },
        { text: 'Option B', position: 2 }
      ],
      chosen_option_id: null,
      outcome: 'Negative',
      outcome_notes: 'Did not work out',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    },
    {
      user_id: user.id,
      title: 'Test Decision 4 - Feature 46',
      context: 'Testing position bias',
      emotional_state: 'Calm',
      category: 'Health',
      options: [
        { text: 'First Option', position: 1 },
        { text: 'Second Option', position: 2 },
        { text: 'Third Option', position: 3 }
      ],
      chosen_option_id: null,
      outcome: 'Positive',
      outcome_notes: 'Good choice',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      user_id: user.id,
      title: 'Test Decision 5 - Feature 46',
      context: 'More data for patterns',
      emotional_state: 'Excited',
      category: 'Personal',
      options: [
        { text: 'Option A', position: 1 },
        { text: 'Option B', position: 2 }
      ],
      chosen_option_id: null,
      outcome: 'Neutral',
      outcome_notes: 'As expected',
      created_at: new Date().toISOString()
    }
  ];

  let createdCount = 0;
  for (const decision of decisions) {
    try {
      // First insert options to get their IDs
      const { data: optionData, error: optionError } = await supabase
        .from('decision_options')
        .insert(decision.options.map(opt => ({
          decision_id: 'temp', // Will update after
          text: opt.text,
          position: opt.position,
          pros: JSON.stringify([]),
          cons: JSON.stringify([])
        })))
        .select();

      if (optionError) {
        console.error('Error inserting options:', optionError.message);
        continue;
      }

      // Now insert the decision
      const { data: decisionData, error: decisionError } = await supabase
        .from('decisions')
        .insert({
          user_id: decision.user_id,
          title: decision.title,
          context: decision.context,
          emotional_state: decision.emotional_state,
          category: decision.category,
          chosen_option_id: optionData[0].id, // Choose first option
          outcome: decision.outcome,
          outcome_notes: decision.outcome_notes,
          created_at: decision.created_at
        })
        .select();

      if (decisionError) {
        console.error('Error inserting decision:', decisionError.message);
        continue;
      }

      // Update options with correct decision_id
      await supabase
        .from('decision_options')
        .update({ decision_id: decisionData[0].id })
        .in('id', optionData.map(o => o.id));

      createdCount++;
      console.log(`✅ Created: ${decision.title}`);

    } catch (err) {
      console.error('Error:', err.message);
    }
  }

  console.log(`\n✅ Total decisions created: ${createdCount}`);
  console.log('You can now navigate to /insights to see pattern cards!');
}

addTestDecisions();
