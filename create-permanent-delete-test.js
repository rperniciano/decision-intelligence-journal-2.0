const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51'; // session35test user

  // Create a decision
  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'PERMANENT_DELETE_TEST_SESSION44',
      status: 'decided',
      detected_emotional_state: 'confident',
      description: 'Test decision for permanent delete feature',
      created_at: new Date().toISOString(),
      decided_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating decision:', error);
    return;
  }

  console.log('✅ Created test decision:', decision.title);
  console.log('Decision ID:', decision.id);

  // Soft delete it (move to trash)
  const { data: deleted, error: deleteError } = await supabase
    .from('decisions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', decision.id)
    .select()
    .single();

  if (deleteError) {
    console.error('Error soft-deleting decision:', deleteError);
    return;
  }

  console.log('✅ Soft-deleted decision (moved to trash)');
  console.log('Deleted at:', deleted.deleted_at);
}

createTestDecision();
