// Create multiple test decisions via API for pagination testing

const decisions = [
  { title: 'Should I buy a new laptop?', category: 'Technology', status: 'decided' },
  { title: 'Which framework to use for my project?', category: 'Development', status: 'deliberating' },
  { title: 'Should I take the job offer?', category: 'Career', status: 'decided' },
  { title: 'What color should I paint my room?', category: 'Home', status: 'draft' },
  { title: 'Should I learn Python or JavaScript first?', category: 'Education', status: 'deliberating' },
  { title: 'Which streaming service to subscribe to?', category: 'Entertainment', status: 'decided' },
  { title: 'Should I get a gym membership?', category: 'Health', status: 'draft' },
  { title: 'Where should I go for vacation?', category: 'Travel', status: 'deliberating' },
  { title: 'Should I adopt a pet?', category: 'Lifestyle', status: 'draft' },
  { title: 'Which book should I read next?', category: 'Reading', status: 'decided' },
  { title: 'Should I upgrade my phone?', category: 'Technology', status: 'draft' },
  { title: 'What major should I choose?', category: 'Education', status: 'deliberating' },
];

async function login() {
  const response = await fetch('https://doqojfsldvajmlscpwhu.supabase.co/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'testdev@example.com',
      password: 'testpass123',
    }),
  });

  const data = await response.json();
  console.log('Login response:', data);
  return data.access_token;
}

async function createDecisions() {
  try {
    console.log('Logging in...');
    const token = await login();

    if (!token) {
      console.error('Failed to login');
      return;
    }

    console.log(`Creating ${decisions.length} decisions...\n`);

    for (const decision of decisions) {
      const response = await fetch('http://localhost:3001/api/v1/decisions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: decision.title,
          category: decision.category,
          status: decision.status,
          notes: 'Test decision for pagination',
          options: [],
        }),
      });

      if (response.ok) {
        console.log(`✓ Created: ${decision.title}`);
      } else {
        const error = await response.text();
        console.error(`✗ Failed: ${decision.title} - ${error}`);
      }
    }

    console.log('\nDone! Total decisions created:', decisions.length);
  } catch (error) {
    console.error('Error:', error);
  }
}

createDecisions();
