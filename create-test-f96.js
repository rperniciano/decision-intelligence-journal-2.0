import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://doqojfsldvajmlscpwhu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestData() {
  const timestamp = Date.now();
  const email = `f96-test-${timestamp}@example.com`;
  const password = 'Test1234!';

  console.log('Creating test user for Feature #96...');
  console.log('Email:', email);

  // Create user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (userError) {
    console.error('Error creating user:', userError.message);
    return;
  }

  const userId = userData.user.id;
  console.log('✓ User created:', userId);

  // Create a test decision
  const decision = {
    user_id: userId,
    title: `F96 Test Decision - Restore Me - ${timestamp}`,
    description: 'This decision will be soft deleted and then restored to test Feature #96.',
    status: 'draft',
    created_at: new Date().toISOString()
  };

  const { data: decisionData, error: decisionError } = await supabase
    .from('decisions')
    .insert(decision)
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError.message);
    return;
  }

  console.log('✓ Decision created:', decisionData.id);
  console.log('  Title:', decisionData.title);

  // Soft delete the decision
  const { data: deleteData, error: softDeleteError } = await supabase
    .from('decisions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', decisionData.id)
    .select()
    .single();

  if (softDeleteError) {
    console.error('Error soft deleting decision:', softDeleteError.message);
    return;
  }

  console.log('✓ Decision soft deleted (moved to trash)');
  console.log('\nTest data ready for Feature #96 verification:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Decision ID:', decisionData.id);
  console.log('\nNext steps:');
  console.log('1. Log in with these credentials');
  console.log('2. Navigate to History page');
  console.log('3. Click "Trash" filter');
  console.log('4. Click the "Restore" button on the decision');
  console.log('5. Verify decision is restored');
}

createTestData();
