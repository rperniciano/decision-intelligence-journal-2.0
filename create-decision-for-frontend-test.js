// Create a decision for frontend testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:4011/api/v1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createDecision() {
  console.log('Logging in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'feature266@test.com',
    password: 'test123456'
  });

  if (error) throw error;
  const token = data.session.access_token;

  console.log('Creating test decision...');
  const response = await fetch(`${API_URL}/decisions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'F266 Frontend Test - DELETE ME',
      status: 'decided',
      options: [
        {
          text: 'Option A',
          pros: ['Pro 1'],
          cons: ['Con 1'],
          isChosen: true
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed: ${response.status} - ${text}`);
  }

  const decision = await response.json();
  console.log(`\n✓ Decision created: ${decision.id}`);
  console.log(`\nFrontend URL: http://localhost:5177/decisions/${decision.id}`);
  console.log(`\nYou can now:`);
  console.log(`1. Open the decision in the browser`);
  console.log(`2. Delete it using the API or another browser`);
  console.log(`3. Try to interact with it in the first browser`);
}

createDecision();
