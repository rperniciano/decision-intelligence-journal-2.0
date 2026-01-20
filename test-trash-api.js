import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testTrashAPI() {
  // Sign in to get token
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'f10-logout-test-1768886783687@example.com',
    password: 'Test1234!'
  });

  if (error) {
    console.log('Login error:', error.message);
    return;
  }

  const token = data.session.access_token;
  console.log('Got token, testing trash endpoint...');

  // Test trash endpoint
  const response = await fetch('http://localhost:3001/decisions/trash', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('Response status:', response.status);
  const result = await response.json();
  console.log('Response:', JSON.stringify(result, null, 2));
}

testTrashAPI();
