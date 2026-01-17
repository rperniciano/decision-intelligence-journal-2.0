import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createHealthDecision() {
  const mobileTestUserId = '94bd67cb-b094-4387-a9c8-26b0c65904cd';
  // Health category ID from our list
  const healthCategoryId = 'ab4c15fd-c18f-4dbf-8217-ce3a97876726';

  const { data, error} = await supabase
    .from('decisions')
    .insert([
      {
        user_id: mobileTestUserId,
        title: 'HEALTH_DECISION_1',
        description: 'Health decision for category filter test',
        status: 'decided',
        detected_emotional_state: 'confident',
        category_id: healthCategoryId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    console.error('Error creating decision:', error);
    process.exit(1);
  }

  console.log('Created 1 Health decision:');
  console.log(`- ${data[0].title} (ID: ${data[0].id})`);
}

createHealthDecision();
