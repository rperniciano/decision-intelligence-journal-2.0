// Script to create a test decision for testing
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  // Login as test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testdev@example.com',
    password: 'testpass123',
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }

  console.log('✓ Logged in as testdev@example.com');

  // Create test decision
  const { data: decision, error: createError } = await supabase
    .from('decisions')
    .insert({
      title: 'Should I learn TypeScript or stay with JavaScript?',
      status: 'deliberating',
      category: 'Career',
      emotional_state: 'curious',
      options: [
        {
          id: 'opt-1',
          text: 'Learn TypeScript',
          pros: ['Better type safety', 'Industry standard', 'Improved IDE support'],
          cons: ['Learning curve', 'More verbose code']
        },
        {
          id: 'opt-2',
          text: 'Stay with JavaScript',
          pros: ['Already familiar', 'Faster development', 'Less boilerplate'],
          cons: ['Harder to catch bugs', 'Less tooling support']
        }
      ],
      notes: 'This is an important decision for my career growth.',
      transcription: 'I have been thinking about whether I should invest time in learning TypeScript or just stick with JavaScript. I know TypeScript offers better type safety and is becoming the industry standard, but I am also concerned about the learning curve and the extra verbosity in code.'
    })
    .select()
    .single();

  if (createError) {
    console.error('Failed to create decision:', createError);
    return;
  }

  console.log('✓ Created test decision:');
  console.log('  ID:', decision.id);
  console.log('  Title:', decision.title);
  console.log('  Options:', decision.options.length);
}

main();
