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

async function createBusinessDecisions() {
  const mobileTestUserId = '94bd67cb-b094-4387-a9c8-26b0c65904cd';
  // Business category ID from our list
  const businessCategoryId = 'ef3c7424-444c-497f-a642-4c93837f8e3f';

  const decisions = [
    {
      user_id: mobileTestUserId,
      title: 'BUSINESS_DECISION_1',
      description: 'First business decision for category filter test',
      status: 'decided',
      detected_emotional_state: 'confident',
      category_id: businessCategoryId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      user_id: mobileTestUserId,
      title: 'BUSINESS_DECISION_2',
      description: 'Second business decision for category filter test',
      status: 'decided',
      detected_emotional_state: 'confident',
      category_id: businessCategoryId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('decisions')
    .insert(decisions)
    .select();

  if (error) {
    console.error('Error creating decisions:', error);
    process.exit(1);
  }

  console.log('Created 2 Business decisions:');
  data.forEach(d => {
    console.log(`- ${d.title} (ID: ${d.id})`);
  });
}

createBusinessDecisions();
