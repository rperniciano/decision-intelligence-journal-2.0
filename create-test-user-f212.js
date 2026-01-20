const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load .env file
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  const email = 'test_f212@example.com';
  const password = 'Test1234';

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  let userId;
  if (existingUser) {
    userId = existingUser.id;
    console.log('Using existing user:', email);
  } else {
    // Create user via auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    userId = authData.user.id;
    console.log('Created user:', email, 'ID:', userId);
  }

  // Create a category
  const { data: categoryData, error: catError } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: 'F212_Test',
      icon: 'star',
      color: '#00d4aa',
    })
    .select()
    .single();

  if (catError) {
    console.error('Category error:', catError);
    throw catError;
  }

  const category = categoryData;
  console.log('Category created:', category.id);

  // Create a decision with 2 options
  const { data: decision } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'F212_TEST: Job Offer Decision',
      status: 'draft',
      category_id: category.id,
    })
    .select()
    .single();

  console.log('Decision created:', decision.id, decision.title);

  // Create options
  const { data: opt1 } = await supabase
    .from('decision_options')
    .insert({
      decision_id: decision.id,
      title: 'Accept the offer',
    })
    .select()
    .single();

  const { data: opt2 } = await supabase
    .from('decision_options')
    .insert({
      decision_id: decision.id,
      title: 'Decline the offer',
    })
    .select()
    .single();

  console.log('Options created:', opt1.id, opt2.id);
  console.log('\n========================================');
  console.log('Test data ready!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Decision ID:', decision.id);
  console.log('========================================');
}

createTestData().catch(console.error);
