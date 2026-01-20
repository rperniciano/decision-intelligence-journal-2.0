const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  const email = 'testf192search@example.com';
  const password = 'Test1234!';

  // Create user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log('Created auth user:', userId, email);

  // Create some test decisions with various content including special characters
  const decisions = [
    {
      user_id: userId,
      title: 'Test Decision with @#$%',
      content: 'Should I use special characters in my search?',
      status: 'decided'
    },
    {
      user_id: userId,
      title: 'Regular Decision',
      content: 'This is a normal decision without special characters',
      status: 'decided'
    },
    {
      user_id: userId,
      title: 'Another Decision with !*',
      content: 'Testing special characters in title and content',
      status: 'draft'
    }
  ];

  for (const decision of decisions) {
    const { error: decisionError } = await supabase
      .from('decisions')
      .insert(decision);

    if (decisionError) {
      console.error('Decision error:', decisionError.message);
    } else {
      console.log('Created decision:', decision.title);
    }
  }

  console.log('\nUser created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Decisions created:', decisions.length);
}

createUser();
