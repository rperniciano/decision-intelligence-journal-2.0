const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testTimestampFeature() {
  console.log('=== Feature #63: Timestamp Test ===\n');

  // Record current time BEFORE creating decision
  const timeBefore = new Date();
  console.log('📅 Current time (before):', timeBefore.toISOString());

  // Get the test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.error('❌ No users found');
    return;
  }

  const user = users[0];
  const userId = user.id;
  console.log('✅ Using user:', user.email, '(' + userId + ')');

  // Get a category ID
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (!categories || categories.length === 0) {
    console.error('❌ No categories found');
    return;
  }

  const categoryId = categories[0].id;
  console.log('✅ Using category:', categories[0].name);

  // Create a test decision
  const decisionData = {
    user_id: userId,
    title: 'F63: Timestamp Test Decision ' + Date.now(),
    status: 'draft',
    category_id: categoryId
  };

  console.log('\n📝 Creating test decision...');
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert(decisionData)
    .select()
    .single();

  if (decisionError) {
    console.error('❌ Error creating decision:', decisionError);
    return;
  }

  // Record time AFTER creating decision
  const timeAfter = new Date();
  console.log('✅ Decision created!');
  console.log('   Decision ID:', decision.id);
  console.log('   Created at (from DB):', decision.created_at);
  console.log('📅 Current time (after):', timeAfter.toISOString());

  // Verify timestamp is real
  const createdDate = new Date(decision.created_at);
  const timeDiffBefore = Math.abs(createdDate - timeBefore);
  const timeDiffAfter = Math.abs(createdDate - timeAfter);

  console.log('\n🔍 Verification:');
  console.log('   Time difference from "before":', Math.round(timeDiffBefore / 1000), 'seconds');
  console.log('   Time difference from "after":', Math.round(timeDiffAfter / 1000), 'seconds');

  // Check if timestamp is within reasonable range (within 1 minute)
  const maxAllowedDiff = 60000; // 1 minute in milliseconds
  const isRealTimestamp = timeDiffBefore < maxAllowedDiff && timeDiffAfter < maxAllowedDiff;

  // Check if it's not a hardcoded/fake date
  const currentYear = new Date().getFullYear();
  const decisionYear = createdDate.getFullYear();
  const notFakeDate = decisionYear >= 2024 && decisionYear <= currentYear + 1;

  console.log('\n✅ Test Results:');
  console.log('   Timestamp is real (within 1 minute):', isRealTimestamp ? '✅ PASS' : '❌ FAIL');
  console.log('   Not a fake/hardcoded date:', notFakeDate ? '✅ PASS' : '❌ FAIL');

  if (isRealTimestamp && notFakeDate) {
    console.log('\n🎉 Feature #63: PASSING');
    console.log('   Timestamps are real and accurate!');
  } else {
    console.log('\n❌ Feature #63: FAILING');
    console.log('   Timestamps are NOT real or accurate!');
  }

  // Cleanup: Delete the test decision
  console.log('\n🧹 Cleaning up test decision...');
  await supabase
    .from('decisions')
    .delete()
    .eq('id', decision.id);
  console.log('✅ Test decision deleted');

  console.log('\n=== Test Complete ===');
}

testTimestampFeature().catch(console.error);
