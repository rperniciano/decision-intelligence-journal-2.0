const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDecisions() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Login
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test-f80-1768914878@example.com',
    password: 'testpass123',
  });

  if (error) {
    console.error('Login failed:', error.message);
    return;
  }

  const token = data.session.access_token;

  // Check for decisions
  const response = await fetch('http://localhost:4001/api/v1/decisions', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const decisions = await response.json();

  console.log(`Found ${decisions.length || 0} decisions`);
  if (decisions.length > 0) {
    console.log('\nDecisions:');
    decisions.forEach((d, i) => {
      console.log(`${i + 1}. ${d.title} (${d.status})`);
      console.log(`   Has audio: ${!!d.audio_url}`);
      console.log(`   Has transcription: ${!!d.transcription}`);
      console.log(`   Options: ${d.options?.length || 0}`);
    });
  }
}

checkDecisions();
