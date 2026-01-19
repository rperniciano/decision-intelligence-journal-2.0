// Debug API response for feature #265
require('dotenv').config();

async function debugApiResponse() {
  const API_URL = 'http://localhost:4010/api/v1';
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  console.log('=== Debugging API Response ===\n');

  // Login
  const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      email: 'feature265-test@example.com',
      password: 'test123456'
    })
  });

  const loginData = await loginResponse.json();
  const token = loginData.access_token;

  // Create a decision
  const createResponse = await fetch(`${API_URL}/decisions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Debug Test',
      category: 'test',
      status: 'in_progress'
    })
  });

  const decision = await createResponse.json();
  console.log('Created decision response:');
  console.log(JSON.stringify(decision, null, 2));
  console.log('\nHas updatedAt?', 'updatedAt' in decision);
  console.log('Has updated_at?', 'updated_at' in decision);

  // Cleanup
  await fetch(`${API_URL}/decisions/${decision.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

debugApiResponse().catch(console.error);
