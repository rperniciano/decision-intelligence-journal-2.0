/**
 * Script to create test decisions for Feature #78: Emotions stored per decision
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

const TEST_EMAIL = 'f96-test-1768888401473@example.com';

async function getUserId() {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) throw error;

  const user = data.users.find(u => u.email === TEST_EMAIL);
  if (!user) throw new Error(`User not found: ${TEST_EMAIL}`);

  return user.id;
}

async function createDecisionWithEmotion(userId, title, emotionalState) {
  // First, create a minimal decision
  const decisionData = {
    user_id: userId,
    title,
    transcript: `Test transcript for ${title}`,
    status: 'decided',
    recorded_at: new Date().toISOString(),
    decided_at: new Date().toISOString(),
  };

  // Try to include emotional_state
  try {
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        ...decisionData,
        emotional_state: emotionalState,
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating decision "${title}":`, error.message);
      // Try without emotional_state
      const { data: data2, error: error2 } = await supabase
        .from('decisions')
        .insert(decisionData)
        .select()
        .single();

      if (error2) {
        console.error(`Error creating decision without emotion:`, error2.message);
        return null;
      }

      console.log(`✓ Created decision: "${title}" (without emotion column)`);
      return data2;
    }

    console.log(`✓ Created decision: "${title}" with emotion: ${emotionalState}`);
    return data;
  } catch (err) {
    console.error(`Exception creating decision "${title}":`, err.message);
    return null;
  }
}

async function main() {
  console.log('Creating test decisions for Feature #78...\n');

  const userId = await getUserId();
  console.log(`User ID: ${userId}\n`);

  const timestamp = Date.now();

  const decisions = [
    {
      title: `F78 Test - Anxious Decision - ${timestamp}`,
      emotionalState: 'anxious',
    },
    {
      title: `F78 Test - Confident Decision - ${timestamp}`,
      emotionalState: 'confident',
    },
    {
      title: `F78 Test - Calm Decision - ${timestamp}`,
      emotionalState: 'calm',
    },
    {
      title: `F78 Test - Excited Decision - ${timestamp}`,
      emotionalState: 'excited',
    },
    {
      title: `F78 Test - Stressed Decision - ${timestamp}`,
      emotionalState: 'stressed',
    },
  ];

  for (const decision of decisions) {
    await createDecisionWithEmotion(userId, decision.title, decision.emotionalState);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n✅ All test decisions created successfully!');
  console.log(`Timestamp: ${timestamp}`);
}

main().catch(console.error);
