// Create a test decision via API
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  // Login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testdev@example.com',
    password: 'testpass123',
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }

  const token = authData.session.access_token;
  console.log('✓ Logged in');

  // Create decision
  const response = await fetch('http://localhost:3001/api/v1/decisions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Should I learn TypeScript or stay with JavaScript?',
      status: 'deliberating',
      category: 'Career',
      emotional_state: 'curious',
      notes: 'This is an important decision for my career growth.',
      transcription: 'I have been thinking about whether I should invest time in learning TypeScript.',
      options: [
        {
          text: 'Learn TypeScript',
          pros: ['Better type safety', 'Industry standard', 'Improved IDE support'],
          cons: ['Learning curve', 'More verbose code']
        },
        {
          text: 'Stay with JavaScript',
          pros: ['Already familiar', 'Faster development', 'Less boilerplate'],
          cons: ['Harder to catch bugs', 'Less tooling support']
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create decision:', error);
    return;
  }

  const decision = await response.json();
  console.log('✓ Decision created:', decision.id);
  console.log('Title:', decision.title);
  console.log('Status:', decision.status);
  console.log('Options:', decision.options?.length || 0);
}

main().catch(console.error);
