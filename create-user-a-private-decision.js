const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // First, get User A's ID (session22test@example.com)
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  const userA = users.users.find(u => u.email === 'session22test@example.com');

  if (!userA) {
    console.error('User A (session22test@example.com) not found');
    return;
  }

  console.log('User A found:', userA.id, userA.email);

  // Create a decision for User A with unique searchable title
  const decisionTitle = 'USER_A_PRIVATE_SESSION23';

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userA.id,
      title: decisionTitle,
      description: 'This is a private decision for User A only. Should not be visible to User B.',
      category_id: 'f0427913-ec86-4ec4-b135-3c4d2b91c2d3', // Career
      status: 'decided'
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✅ Created decision for User A:');
  console.log('   ID:', decision.id);
  console.log('   Title:', decision.title);
  console.log('   User ID:', decision.user_id);
  console.log('\nThis decision should ONLY be visible to session22test@example.com');
}

main();
