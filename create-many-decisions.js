// Create multiple test decisions for pagination testing
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://doqojfsldvajmlscpwhu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const decisions = [
  { title: 'Should I buy a new laptop?', category: 'Technology', status: 'decided' },
  { title: 'Which framework to use for my project?', category: 'Development', status: 'deliberating' },
  { title: 'Should I take the job offer?', category: 'Career', status: 'decided' },
  { title: 'What color should I paint my room?', category: 'Home', status: 'draft' },
  { title: 'Should I learn Python or JavaScript first?', category: 'Education', status: 'deliberating' },
  { title: 'Which streaming service to subscribe to?', category: 'Entertainment', status: 'decided' },
  { title: 'Should I get a gym membership?', category: 'Health', status: 'draft' },
  { title: 'Where should I go for vacation?', category: 'Travel', status: 'deliberating' },
  { title: 'Should I adopt a pet?', category: 'Lifestyle', status: 'draft' },
  { title: 'Which book should I read next?', category: 'Reading', status: 'decided' },
  { title: 'Should I upgrade my phone?', category: 'Technology', status: 'draft' },
  { title: 'What major should I choose?', category: 'Education', status: 'deliberating' },
];

async function createDecisions() {
  try {
    // Get test user
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find(u => u.email === 'testdev@example.com');

    if (!testUser) {
      console.error('Test user not found');
      return;
    }

    console.log(`Creating ${decisions.length} decisions for user ${testUser.email}...`);

    for (const decision of decisions) {
      const { data, error } = await supabase
        .from('decisions')
        .insert({
          user_id: testUser.id,
          title: decision.title,
          category: decision.category,
          status: decision.status,
          notes: `Test decision for pagination`,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating "${decision.title}":`, error.message);
      } else {
        console.log(`✓ Created: ${decision.title}`);
      }
    }

    console.log('\nDone! Total decisions created:', decisions.length);
  } catch (error) {
    console.error('Error:', error);
  }
}

createDecisions();
