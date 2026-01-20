const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function addTestDecision() {
  // First, get the user
  const { data: { user }, error: userError } = await supabase.auth.signInWithPassword({
    email: 'f201-test@example.com',
    password: 'password123',
  });

  if (userError) {
    console.error('Login error:', userError.message);
    return;
  }

  console.log('Logged in as:', user.email);

  // Create a test decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'Test Decision for Feature 224',
      description: 'Testing button disabled state during save',
      status: 'draft',
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError.message);
    return;
  }

  console.log('Created decision:', decision.id);
  console.log('Decision URL:', `http://localhost:5173/decisions/${decision.id}/edit`);
}

addTestDecision().then(() => process.exit(0));
