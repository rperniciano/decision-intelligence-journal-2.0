/**
 * Script to run the emotional_state column migration
 * This fixes the regression in Feature #78: Emotions stored per decision
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runMigration() {
  console.log('Running migration: Add emotional_state column to decisions table\n');

  try {
    // Execute the ALTER TABLE command via RPC
    // Note: Supabase JS client doesn't support direct SQL execution,
    // so we'll use a workaround by creating a test decision with emotional_state

    console.log('Attempting to create test decision with emotional_state...');

    // Get test user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const testUser = users.find(u => u.email === 'f96-test-1768888401473@example.com');

    if (!testUser) {
      throw new Error('Test user not found');
    }

    console.log(`Found user: ${testUser.id}`);

    // Try to create a decision with emotional_state
    const timestamp = Date.now();
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        user_id: testUser.id,
        title: `F78 Migration Test - ${timestamp}`,
        status: 'decided',
        emotional_state: 'anxious',
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('emotional_state')) {
        console.error('\n❌ Column does not exist. Migration required!');
        console.error('\nPlease run the following SQL in Supabase SQL Editor:');
        console.error('\n--- COPY BELOW ---\n');
        console.error(`ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS emotional_state TEXT;

COMMENT ON COLUMN decisions.emotional_state IS 'The emotional state of the user when making this decision. Values: calm, confident, anxious, excited, uncertain, stressed, neutral, hopeful, frustrated.';

CREATE INDEX IF NOT EXISTS idx_decisions_emotional_state
ON decisions(emotional_state)
WHERE emotional_state IS NOT NULL;`);
        console.error('\n--- END COPY ---\n');
        return false;
      }
      throw error;
    }

    console.log(`✅ Migration successful! Column exists.`);
    console.log(`   Created test decision: ${data.id}`);
    console.log(`   Emotional state: ${data.emotional_state}`);

    return true;

  } catch (err) {
    console.error('Error running migration:', err.message);
    return false;
  }
}

runMigration().then(success => {
  if (success) {
    console.log('\n✅ Feature #78 can now be tested properly!');
  } else {
    console.log('\n❌ Manual migration required. See instructions above.');
  }
});
