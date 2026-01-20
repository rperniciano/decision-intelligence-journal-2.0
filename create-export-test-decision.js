const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTestDecision() {
  const userId = 'e9f18b63-4f41-416f-bbef-a040f315db1e';

  const now = new Date();
  const testDate = now.toISOString();

  const decision = {
    user_id: userId,
    title: 'EXPORT_INTEGRITY_TEST_2025 - Should I switch careers to AI development?',
    description: 'Testing export feature integrity. This is a detailed description about a career decision. Special characters: @#$%^&*()_+-=[]{}|;:\'",.<>?/~` Numbers: 1234567890 Unicode: ñ é ü 测试 🎯',
    status: 'draft',
    created_at: testDate,
    updated_at: testDate,
    // Note: using only columns that exist in the schema
  };

  console.log('Creating test decision with specific details for export verification...');
  console.log('Expected values:');
  console.log('- Title:', decision.title);
  console.log('- Description length:', decision.description.length);
  console.log('- Status:', decision.status);
  console.log('- Created at:', testDate);

  const { data, error } = await supabase
    .from('decisions')
    .insert(decision)
    .select()
    .single();

  if (error) {
    console.error('Error creating decision:', error.message);
    console.error('Details:', error);
  } else {
    console.log('✅ Test decision created successfully!');
    console.log('Decision ID:', data.id);
    console.log('\n📝 VERIFICATION CHECKLIST:');
    console.log('1. Title should contain: EXPORT_INTEGRITY_TEST_2025');
    console.log('2. Description should have special characters: @#$%^&*()');
    console.log('3. Description should have Unicode: ñ é ü 测试 🎯');
    console.log('4. Status should be: draft');
    console.log('5. Created date should match:', testDate);
    console.log('6. Updated at should match created at:', testDate);
  }
}

createTestDecision();
