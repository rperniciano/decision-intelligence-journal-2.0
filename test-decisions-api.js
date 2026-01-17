import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAPI() {
  // Login first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'session35test@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('Login error:', authError);
    return;
  }

  const token = authData.session.access_token;
  console.log('Logged in successfully');

  // Test API
  const response = await fetch('http://localhost:3001/api/v1/decisions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log('API Response:', JSON.stringify(data, null, 2));
  console.log('Number of decisions:', data.decisions?.length || 0);
}

testAPI();
