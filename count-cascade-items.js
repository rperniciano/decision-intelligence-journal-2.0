import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function countItems() {
  const decisionId = '8a905612-4251-4b15-8cbd-dc99b4b63cdd';

  try {
    // Count options for this decision
    const { data: options, error: optError } = await supabase
      .from('options')
      .select('id')
      .eq('decision_id', decisionId);

    if (optError) {
      console.error('Error counting options:', optError);
      return;
    }

    console.log('Decision ID:', decisionId);
    console.log('Options count:', options.length);
    console.log('Option IDs:', options.map(o => o.id));

    if (options.length > 0) {
      // Count pros_cons for these options
      const optionIds = options.map(o => o.id);

      const { data: prosCons, error: pcError } = await supabase
        .from('pros_cons')
        .select('id, type')
        .in('option_id', optionIds);

      if (pcError) {
        console.error('Error counting pros/cons:', pcError);
        return;
      }

      console.log('Pros/Cons count:', prosCons.length);
      console.log('Pros:', prosCons.filter(pc => pc.type === 'pro').length);
      console.log('Cons:', prosCons.filter(pc => pc.type === 'con').length);
      console.log('Pros/Cons IDs:', prosCons.map(pc => pc.id));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

countItems();
