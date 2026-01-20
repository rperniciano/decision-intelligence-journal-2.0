// No import needed - fetch is built-in in Node 18+

const SUPABASE_URL = 'https://doqojfsldvajmlscpwhu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc';

async function getAuthToken() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY
    },
    body: JSON.stringify({
      email: 'feature46-test-1768908020276@example.com',
      password: 'password123'
    })
  });

  const data = await response.json();
  return data.access_token;
}

async function createDecision(token, decisionData) {
  const response = await fetch('http://localhost:4001/api/v1/decisions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(decisionData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Error creating decision:', error);
    return null;
  }

  return await response.json();
}

async function main() {
  console.log('Getting auth token...');
  const token = await getAuthToken();
  console.log('✅ Got token');

  const decisions = [
    {
      title: 'Test Decision 1 - Feature 46',
      context: 'Testing pattern navigation',
      emotionalState: 'Calm',
      category: 'Work',
      options: [
        { text: 'Option A', pros: ['Pro 1'], cons: ['Con 1'] },
        { text: 'Option B', pros: ['Pro 2'], cons: ['Con 2'] }
      ],
      chosenOptionIndex: 0,
      outcome: 'positive',
      outcomeNotes: 'Worked out well'
    },
    {
      title: 'Test Decision 2 - Feature 46',
      context: 'Testing with different emotion',
      emotionalState: 'Excited',
      category: 'Personal',
      options: [
        { text: 'Option A', pros: [], cons: [] },
        { text: 'Option B', pros: [], cons: [] },
        { text: 'Option C', pros: [], cons: [] }
      ],
      chosenOptionIndex: 1,
      outcome: 'positive',
      outcomeNotes: 'Great result'
    },
    {
      title: 'Test Decision 3 - Feature 46',
      context: 'Testing with negative outcome',
      emotionalState: 'Anxious',
      category: 'Work',
      options: [
        { text: 'Option A', pros: [], cons: [] },
        { text: 'Option B', pros: [], cons: [] }
      ],
      chosenOptionIndex: 0,
      outcome: 'negative',
      outcomeNotes: 'Did not work out'
    },
    {
      title: 'Test Decision 4 - Feature 46',
      context: 'Testing position bias (chose first)',
      emotionalState: 'Calm',
      category: 'Health',
      options: [
        { text: 'First Option', pros: [], cons: [] },
        { text: 'Second Option', pros: [], cons: [] },
        { text: 'Third Option', pros: [], cons: [] }
      ],
      chosenOptionIndex: 0,
      outcome: 'positive',
      outcomeNotes: 'Good choice'
    },
    {
      title: 'Test Decision 5 - Feature 46',
      context: 'More data for patterns',
      emotionalState: 'Excited',
      category: 'Personal',
      options: [
        { text: 'Option A', pros: [], cons: [] },
        { text: 'Option B', pros: [], cons: [] }
      ],
      chosenOptionIndex: 1,
      outcome: 'neutral',
      outcomeNotes: 'As expected'
    }
  ];

  let created = 0;
  for (const decision of decisions) {
    const result = await createDecision(token, decision);
    if (result) {
      created++;
      console.log(`✅ Created: ${decision.title}`);
    } else {
      console.log(`❌ Failed: ${decision.title}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Total created: ${created}/5`);
  console.log('Now navigate to http://localhost:5199/insights to test pattern navigation!');
}

main();
