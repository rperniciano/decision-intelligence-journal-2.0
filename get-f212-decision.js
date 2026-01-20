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

async function setupTestData() {
  const email = 'test_f212@example.com';
  const password = 'Test1234';

  // Try to get user from auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  let userId = users?.find(u => u.email === email)?.id;

  if (!userId) {
    console.log('Creating user via auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError && authError.status !== 422) { // 422 = already exists
      console.error('Auth error:', authError);
      throw authError;
    }

    if (authData?.user?.id) {
      userId = authData.user.id;
    } else {
      // User exists in auth but we need to get the ID
      const { data: { users: users2 } } = await supabase.auth.admin.listUsers();
      userId = users2?.find(u => u.email === email)?.id;
    }
  }

  console.log('User ID:', userId);

  // Check if user exists in users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!existingUser) {
    console.log('Creating user in users table...');
    await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
      });
  }

  // Get or create category
  const { data: existingCat } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('name', 'F212_Test')
    .maybeSingle();

  let categoryId;
  if (existingCat) {
    categoryId = existingCat.id;
    console.log('Using existing category');
  } else {
    const { data: newCat } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: 'F212_Test',
        icon: 'star',
        color: '#00d4aa',
      })
      .select()
      .single();
    categoryId = newCat.id;
    console.log('Created category');
  }

  // Get or create decision
  const { data: existingDec } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', userId)
    .eq('title', 'F212_TEST: Job Offer Decision')
    .maybeSingle();

  let decisionId;
  if (existingDec) {
    decisionId = existingDec.id;
    console.log('Using existing decision');
  } else {
    const { data: newDec } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: 'F212_TEST: Job Offer Decision',
        status: 'draft',
        category_id: categoryId,
      })
      .select()
      .single();
    decisionId = newDec.id;
    console.log('Created decision');

    // Create options
    await supabase
      .from('decision_options')
      .insert([
        { decision_id: decisionId, title: 'Accept the offer' },
        { decision_id: decisionId, title: 'Decline the offer' },
      ]);
    console.log('Created options');
  }

  console.log('\n========================================');
  console.log('Test data ready!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Decision ID:', decisionId);
  console.log('========================================');
}

setupTestData().catch(console.error);
