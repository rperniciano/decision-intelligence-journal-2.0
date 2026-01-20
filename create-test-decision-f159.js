const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDecisionForF159() {
  console.log('Creating test decision for Feature #159 verification...');

  // Generate a unique test user
  const testEmail = `test_f159_${Date.now()}@example.com`;
  const testPassword = 'test123456';

  try {
    // Create user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (userError) throw userError;

    const userId = userData.user.id;
    console.log(`✓ Created test user: ${testEmail}`);

    // Create a decision with options for testing the extraction review page
    // Using the API format instead of direct DB insertion
    const decisionData = {
      title: 'TEST_F159_Which Job Offer Should I Take',
      status: 'deliberating',
      category: 'Career',
      emotional_state: 'anxious',
      options: [
        {
          id: crypto.randomUUID(),
          text: 'Tech Startup',
          pros: ['High growth potential', 'More responsibility'],
          cons: ['Risky', 'Lower base salary']
        },
        {
          id: crypto.randomUUID(),
          text: 'Established Corporation',
          pros: ['Stable', 'Better benefits'],
          cons: ['Slower growth', 'Bureaucratic']
        }
      ]
    };

    // Get auth token for API call
    const { data: { session } } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    // Call API to create decision
    const response = await fetch('http://localhost:3001/decisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(decisionData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create decision: ${error}`);
    }

    const decision = await response.json();

    console.log(`✓ Created test decision: ${decision.id}`);
    console.log(`✓ Decision title: ${decision.title}`);
    console.log(`✓ Status: ${decision.status}`);
    console.log('');
    console.log('TEST DATA CREATED SUCCESSFULLY');
    console.log('================================');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log(`Decision ID: ${decision.id}`);
    console.log(`Review URL: http://localhost:5173/decisions/${decision.id}/review`);
    console.log('');
    console.log('You can now log in and navigate to the review page to test Feature #159');

  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestDecisionForF159();
