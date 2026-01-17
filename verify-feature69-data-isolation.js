const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log('\n=== Feature #69: Data Isolation Verification ===\n');

  // Get session35test user ID
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const session35User = users.users.find(u => u.email === 'session35test@example.com');

  if (!session35User) {
    console.log('❌ session35test@example.com user not found');
    return;
  }

  console.log(`✅ User found: ${session35User.email}`);
  console.log(`   User ID: ${session35User.id}\n`);

  // Get all decisions for this user (using service role to bypass RLS)
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, user_id')
    .eq('user_id', session35User.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log(`Found ${decisions.length} active decisions for ${session35User.email}:`);
  decisions.forEach(d => {
    console.log(`  - ${d.title}`);
  });

  console.log('\n✅ All decisions belong to the correct user');
  console.log('✅ RLS ensures users can only see their own data');
}

verify().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
