const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5MTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function createTestDecisions() {
  const email = 'regression-test-241@example.com';

  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('email', email);

  if (!users || users.length === 0) {
    console.log('User not found');
    return;
  }

  const userId = users[0].id;
  console.log('User ID:', userId);

  const decisions = [
    {
      user_id: userId,
      title: 'Short Decision',
      context: 'Quick choice',
      options: [
        { id: 1, content: 'Option A', pros: 'Fast', cons: 'Risky' },
        { id: 2, content: 'Option B', pros: 'Safe', cons: 'Slow' }
      ],
      category: 'Career',
      emotional_state: 'Neutral',
      importance_score: 5
    },
    {
      user_id: userId,
      title: 'Medium Length Decision Title That Spans Multiple Words',
      context: 'This is a medium length context that provides some detail about the decision without being too verbose. It has multiple sentences.',
      options: [
        { id: 1, content: 'Option A with detailed description', pros: 'Benefit one, benefit two, and benefit three', cons: 'Drawback one and drawback two' },
        { id: 2, content: 'Option B with equally detailed description', pros: 'Advantage one, advantage two', cons: 'Disadvantage one and disadvantage two' }
      ],
      category: 'Personal',
      emotional_state: 'Confident',
      importance_score: 7
    },
    {
      user_id: userId,
      title: 'Very Long Decision Title That Extends Across Multiple Lines and Contains Many Words to Test Card Resizing',
      context: 'This is a very long context description that contains multiple sentences and extensive details. It is designed to test how well the card handles longer content without breaking the layout.',
      options: [
        { id: 1, content: 'Option A with very long content description that should wrap properly within the card layout', pros: 'This is a long pro list with multiple items', cons: 'This is a long con list with multiple drawbacks' },
        { id: 2, content: 'Option B with equally extensive content description that tests the card layout capabilities', pros: 'Multiple benefits here', cons: 'Multiple drawbacks' }
      ],
      category: 'Career',
      emotional_state: 'Anxious',
      importance_score: 9
    }
  ];

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        user_id: decision.user_id,
        title: decision.title,
        context: decision.context,
        options: decision.options,
        category: decision.category,
        emotional_state: decision.emotional_state,
        importance_score: decision.importance_score,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.log('Error creating decision:', error.message);
    } else {
      console.log('Created decision:', decision.title);
    }
  }

  console.log('Test decisions created successfully');
}

createTestDecisions().catch(console.error);
