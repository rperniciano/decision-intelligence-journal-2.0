import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCategoriesAPI() {
  // Login first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mobiletest@example.com',
    password: 'password123',
  });

  if (authError) {
    console.error('Auth error:', authError);
    process.exit(1);
  }

  const token = authData.session.access_token;
  console.log('Logged in successfully');

  // Test categories endpoint
  const response = await fetch('http://localhost:3001/api/v1/categories', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log('Categories API response:');
  console.log('Status:', response.status);
  console.log('Data type:', Array.isArray(data) ? 'Array' : typeof data);
  console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
  console.log('First 3 categories:');
  if (Array.isArray(data)) {
    data.slice(0, 3).forEach(cat => {
      console.log(`- ${cat.name} (${cat.id})`);
    });
  } else {
    console.log('Full data:', JSON.stringify(data, null, 2));
  }
}

testCategoriesAPI();
