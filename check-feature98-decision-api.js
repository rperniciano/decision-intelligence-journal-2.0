const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkDecisionAPI() {
  // Login
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'session35test@example.com',
    password: 'password123',
  });

  const token = authData.session.access_token;

  // Fetch decision
  const response = await fetch('http://localhost:3001/api/v1/decisions/73520519-b2c4-4ca6-a1b2-11b1152a9542', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const decision = await response.json();

  console.log('Decision title:', decision.title);
  console.log('Number of options:', decision.options?.length || 0);

  if (decision.options && decision.options.length > 0) {
    const option = decision.options[0];
    console.log('\nOption A:', option.text);
    console.log('Pros:', option.pros);
    console.log('Cons:', option.cons);
  }
}

checkDecisionAPI();
