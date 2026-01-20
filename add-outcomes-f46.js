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

async function getDecisions(token) {
  const response = await fetch('http://localhost:4001/api/v1/decisions', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch decisions');
  }

  return await response.json();
}

async function addOutcome(token, decisionId, outcomeData) {
  const response = await fetch(`http://localhost:4001/api/v1/decisions/${decisionId}/outcome`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(outcomeData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Error adding outcome:', error);
    return false;
  }

  return true;
}

async function main() {
  console.log('Getting auth token...');
  const token = await getAuthToken();
  console.log('✅ Got token');

  console.log('Fetching decisions...');
  const decisions = await getDecisions(token);
  console.log(`✅ Found ${decisions.length} decisions`);

  const outcomes = [
    { outcome: 'positive', notes: 'Worked out well' },
    { outcome: 'positive', notes: 'Great result' },
    { outcome: 'negative', notes: 'Did not work out' },
    { outcome: 'positive', notes: 'Good choice' },
    { outcome: 'neutral', notes: 'As expected' }
  ];

  let updated = 0;
  for (let i = 0; i < decisions.length; i++) {
    const decision = decisions[i];
    const outcomeData = outcomes[i];

    console.log(`Adding outcome to: ${decision.title}...`);
    const success = await addOutcome(token, decision.id, outcomeData);

    if (success) {
      updated++;
      console.log(`✅ Added: ${outcomeData.outcome}`);
    } else {
      console.log(`❌ Failed`);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`\n✅ Total updated: ${updated}/${decisions.length}`);
  console.log('Now navigate to http://localhost:5199/insights to see pattern cards!');
}

main();
