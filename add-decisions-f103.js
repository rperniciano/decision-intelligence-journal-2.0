/**
 * Add test decisions for export103@test.com via direct API call
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function addDecisions() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'export103@test.com',
    password: 'test123456',
  });

  if (signInError) {
    console.error('Sign in error:', signInError.message);
    return;
  }

  const userId = signInData.user.id;
  const token = signInData.session.access_token;

  console.log('✓ Logged in as user:', userId);

  // Check existing decisions
  const { data: existing } = await supabase
    .from('decisions')
    .select('id, title')
    .eq('user_id', userId);

  console.log('Existing decisions:', existing?.length || 0);

  // Add a simple test decision
  const decision = {
    title: 'Test Decision for CSV Export',
    status: 'draft',
    category: 'Testing',
    emotional_state: 'excited',
    options: [
      {
        title: 'Option A',
        pros: ['Higher salary', 'Better location'],
        cons: ['Longer hours'],
      },
      {
        title: 'Option B',
        pros: ['Work-life balance'],
        cons: ['Lower salary'],
      },
    ],
    notes: 'This is a test decision for verifying CSV export functionality',
  };

  try {
    const response = await fetch('http://localhost:4013/api/v1/decisions', {
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
      return;
    }

    const data = await response.json();
    console.log('✓ Created decision:', data.id);

    // Verify it was created
    const { data: verify } = await supabase
      .from('decisions')
      .select('id, title')
      .eq('user_id', userId);

    console.log('Total decisions now:', verify?.length || 0);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

addDecisions();
