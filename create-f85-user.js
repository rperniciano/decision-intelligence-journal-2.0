const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Use service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  try {
    const timestamp = Date.now();
    const email = `f85-test-${timestamp}@example.com`;
    const password = 'test123456';

    console.log('Creating test user...');

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'Feature #85 Test User'
      }
    });

    if (error) {
      console.log('Error creating user:', error.message);
      return;
    }

    console.log('✅ User created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', data.user.id);

    // Create a test decision for this user
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: data.user.id,
        title: 'Feature #85 Test Decision',
        description: 'This is a test decision for Feature #85 delete functionality verification',
        status: 'draft',
      })
      .select()
      .single();

    if (decisionError) {
      console.log('Error creating decision:', decisionError.message);
      return;
    }

    console.log('✅ Test decision created:', decision.id);

  } catch (err) {
    console.log('Error:', err.message);
  }
}

createTestUser();
