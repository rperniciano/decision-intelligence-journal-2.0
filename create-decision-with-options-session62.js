import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDecision() {
  try {
    // Get user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === 'session62test@example.com');

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Creating decision for user:', user.id);

    // Create decision with options as JSON array
    const options = [
      {
        id: crypto.randomUUID(),
        text: 'Option A - Original',
        pros: ['Pro A1', 'Pro A2'],
        cons: ['Con A1']
      },
      {
        id: crypto.randomUUID(),
        text: 'Option B - Original',
        pros: ['Pro B1'],
        cons: ['Con B1', 'Con B2']
      },
      {
        id: crypto.randomUUID(),
        text: 'Option C - Original',
        pros: ['Pro C1'],
        cons: ['Con C1']
      }
    ];

    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        title: 'REGRESSION_83_OPTIONS_TEST',
        description: 'Test decision for option editing',
        status: 'in_progress',
        options: JSON.stringify(options),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (decisionError) {
      console.error('Error creating decision:', decisionError);
      return;
    }

    console.log('Decision created:', decision.id);
    console.log('Options:', options.length);
    console.log('\nDecision ID:', decision.id);
    console.log('Navigate to:', `http://localhost:5174/decisions/${decision.id}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

createDecision();
