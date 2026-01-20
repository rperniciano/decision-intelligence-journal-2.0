const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUserAndDecisions() {
  try {
    // Create user with auth.admin API
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'f201-test@example.com',
      password: 'test123456',
      email_confirm: true
    });

    if (userError) {
      if (userError.message.includes('already been registered')) {
        console.log('User already exists, getting existing user...');
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === 'f201-test@example.com');
        if (user) {
          console.log('User ID:', user.id);
          await createDecisions(user.id);
        }
        return;
      }
      throw userError;
    }

    console.log('User created:', userData.user.id);
    await createDecisions(userData.user.id);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function createDecisions(userId) {
  const decisions = [
    {
      user_id: userId,
      title: 'Job Offer Decision',
      description: 'I received a job offer from a startup. The salary is good but the risk is high.',
      detected_emotional_state: 'anxious',
      status: 'draft'
    },
    {
      user_id: userId,
      title: 'Vacation Planning',
      description: 'Planning a trip to Japan. Excited about the itinerary!',
      detected_emotional_state: 'excited',
      status: 'draft'
    },
    {
      user_id: userId,
      title: 'Moving Apartments',
      description: 'Considering whether to move to a new place. Feeling uncertain.',
      detected_emotional_state: 'uncertain',
      status: 'draft'
    },
    {
      user_id: userId,
      title: 'Learning New Skill',
      description: 'Decided to learn TypeScript. Very confident about this!',
      detected_emotional_state: 'confident',
      status: 'draft'
    },
    {
      user_id: userId,
      title: 'Investment Choice',
      description: 'Choosing between stocks and bonds. Feeling stressed about market volatility.',
      detected_emotional_state: 'stressed',
      status: 'draft'
    }
  ];

  // Insert decisions
  const { data, error } = await supabase
    .from('decisions')
    .insert(decisions)
    .select();

  if (error) {
    console.error('Error creating decisions:', error.message);
  } else {
    console.log(`Created ${data.length} test decisions with emotions:`);
    data.forEach(d => {
      console.log(`  - ${d.title}: ${d.detected_emotional_state}`);
    });
  }
}

createTestUserAndDecisions();
