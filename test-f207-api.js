import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testInsightsAPI() {
  // Get the test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.log('No users found');
    return;
  }

  const user = users[0];
  const userId = user.id;
  console.log('Using user:', user.email, '(' + userId + ')');

  // Create a session
  const { data: { session: userSession }, error: sessionError } = await supabase.auth.admin.createSession({
    userId: userId
  });

  if (sessionError || !userSession) {
    console.error('Failed to create session:', sessionError);
    return;
  }

  const token = userSession.access_token;

  // Fetch insights from API
  console.log('\n=== Testing API ===');
  const response = await fetch('http://localhost:4001/insights', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.error('API Error:', response.status);
    const text = await response.text();
    console.error('Response:', text);
    return;
  }

  const insights = await response.json();

  console.log('\n=== Category Performance (topCategories) ===');
  console.log(JSON.stringify(insights.topCategories, null, 2));
}

testInsightsAPI().catch(console.error);
