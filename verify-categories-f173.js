// Verify categories in database for feature #173
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function verifyCategories() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get test user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'testf173@example.com');

  if (!testUser) {
    console.log('❌ Test user not found');
    return;
  }

  // Get categories for this user
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', testUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('❌ Error fetching categories:', error.message);
    return;
  }

  console.log('\n=== Categories in Database ===');
  console.log(`Total: ${categories.length}`);

  const customCategories = categories.filter(c => !c.is_system);
  console.log(`System: ${categories.length - customCategories.length}`);
  console.log(`Custom: ${customCategories.length}\n`);

  customCategories.forEach(cat => {
    console.log(`📋 ${cat.name}`);
    console.log(`   Emoji: ${cat.icon}`);
    console.log(`   Color: ${cat.color}`);
    console.log(`   ID: ${cat.id}`);
    console.log('');
  });

  // Verify "Final Test F173" exists
  const finalTest = categories.find(c => c.name === 'Final Test F173');
  if (finalTest) {
    console.log('✅ "Final Test F173" category found in database');
    console.log(`   Icon: ${finalTest.icon} (🏷️)`);
    console.log(`   Color: ${finalTest.color} (should be #10b981 Green)`);
  } else {
    console.log('❌ "Final Test F173" category NOT found in database');
  }
}

verifyCategories().catch(console.error);
