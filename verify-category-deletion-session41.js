require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: user } = await supabase.auth.admin.listUsers();
  const session35User = user.users.find(u => u.email === 'session35test@example.com');

  if (!session35User) {
    console.log('User not found');
    return;
  }

  console.log('User ID:', session35User.id);

  // Check if the deleted category still exists
  const { data: deletedCat, error: deletedError } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', session35User.id)
    .eq('name', 'DELETE_TEST_CATEGORY_SESSION41');

  console.log('\nSearching for DELETE_TEST_CATEGORY_SESSION41...');
  if (deletedError) {
    console.log('Error:', deletedError);
  } else if (deletedCat.length === 0) {
    console.log('✅ Category successfully deleted from database (not found)');
  } else {
    console.log('❌ Category still exists:', deletedCat);
  }

  // List all custom categories for this user
  const { data: allCategories, error: allError } = await supabase
    .from('categories')
    .select('id, name, icon')
    .eq('user_id', session35User.id);

  console.log('\nAll custom categories for user:');
  if (allError) {
    console.log('Error:', allError);
  } else {
    console.log(JSON.stringify(allCategories, null, 2));
    console.log(`\nTotal: ${allCategories.length} custom categories`);
  }
})();
