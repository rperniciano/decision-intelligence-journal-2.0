// Feature #129: Create test user with decisions for filter testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    const email = 'f129-test-regression@example.com';

    // Try to get existing user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    let userId;

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      userId = existingUser.id;
      console.log(`✅ Found existing user: ${email}`);
      console.log('User ID:', userId);
    } else {
      // Create user with confirmed email
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: 'test123456',
        email_confirm: true,
        user_metadata: { name: 'F129 Regression Tester' }
      });

      if (userError) {
        console.error('Error creating user:', userError);
        return;
      }

      userId = userData.user.id;
      console.log(`✅ User created: ${email}`);
      console.log('User ID:', userId);
    }

    // Create test decisions with different categories and outcomes for filter testing
    const decisions = [
      { title: 'F129 Career Decision', status: 'decided', outcome: 'better', category: 'Career' },
      { title: 'F129 Health Decision', status: 'decided', outcome: 'worse', category: 'Health' },
      { title: 'F129 Finance Decision', status: 'deliberating', outcome: null, category: 'Finance' },
      { title: 'F129 Relationship Decision', status: 'decided', outcome: 'better', category: 'Relationships' },
      { title: 'F129 Another Career Decision', status: 'decided', outcome: 'better', category: 'Career' },
    ];

    console.log('\nCreating test decisions...');
    for (const decision of decisions) {
      await supabase.from('decisions').insert({
        user_id: userId,
        title: decision.title,
        status: decision.status,
        outcome: decision.outcome,
        category_id: null, // Will be set after category creation if needed
      });
    }

    console.log(`✅ Created ${decisions.length} test decisions`);
    console.log('\nLogin credentials:');
    console.log(`Email: ${email}`);
    console.log('Password: test123456');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
