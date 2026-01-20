// Test the PATCH endpoint for decisions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testPatchEndpoint() {
  // Get user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === 'test_f277@example.com');

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('User ID:', user.id);

  // Test the API endpoint
  const decisionId = '49b145f8-d123-4ec0-a199-44a692958da6';

  try {
    const response = await fetch(`http://localhost:4015/api/v1/decisions/${decisionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.id}`, // Using user ID directly for testing
      },
      body: JSON.stringify({ title: 'Test Update' }),
    });

    console.log('Response status:', response.status);
    console.log('Response body:', await response.text());
  } catch (error) {
    console.error('Error:', error);
  }
}

testPatchEndpoint();
