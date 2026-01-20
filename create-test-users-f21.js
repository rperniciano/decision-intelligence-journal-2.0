import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('Creating test users for Feature #21...');

  // Create User A
  const { data: userA, error: errorA } = await supabase.auth.admin.createUser({
    email: 'feature21-usera@example.com',
    password: 'testpass123',
    email_confirm: true,
    user_metadata: {
      name: 'Feature 21 User A'
    }
  });

  if (errorA) {
    console.error('Error creating User A:', errorA);
  } else {
    console.log('✓ User A created:', userA.user.id);
    console.log('  Email:', userA.user.email);
  }

  // Create User B
  const { data: userB, error: errorB } = await supabase.auth.admin.createUser({
    email: 'feature21-userb@example.com',
    password: 'testpass123',
    email_confirm: true,
    user_metadata: {
      name: 'Feature 21 User B'
    }
  });

  if (errorB) {
    console.error('Error creating User B:', errorB);
  } else {
    console.log('✓ User B created:', userB.user.id);
    console.log('  Email:', userB.user.email);
  }

  // Create profiles for both users
  if (userA?.user?.id) {
    const { error: profileErrorA } = await supabase
      .from('profiles')
      .insert({
        id: userA.user.id,
        name: 'Feature 21 User A',
        decision_score: 50,
        total_decisions: 0,
        positive_outcome_rate: 0
      });
    if (profileErrorA) {
      console.error('Error creating profile for User A:', profileErrorA);
    } else {
      console.log('✓ Profile created for User A');
    }
  }

  if (userB?.user?.id) {
    const { error: profileErrorB } = await supabase
      .from('profiles')
      .insert({
        id: userB.user.id,
        name: 'Feature 21 User B',
        decision_score: 50,
        total_decisions: 0,
        positive_outcome_rate: 0
      });
    if (profileErrorB) {
      console.error('Error creating profile for User B:', profileErrorB);
    } else {
      console.log('✓ Profile created for User B');
    }
  }

  console.log('\nUsers ready for testing!');
  console.log('User A: feature21-usera@example.com / testpass123');
  console.log('User B: feature21-userb@example.com / testpass123');
}

createTestUsers().catch(console.error);
