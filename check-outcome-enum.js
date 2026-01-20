// Check valid values for outcome enum
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkEnum() {
  console.log('Checking outcome enum values...\n');

  // Try to insert a test decision to see valid enum values
  const testCases = [
    'success',
    'partial_success',
    'failure',
    'mixed',
    null,
  ];

  for (const value of testCases) {
    try {
      const { data, error } = await supabase
        .from('decisions')
        .select('outcome')
        .limit(1);

      if (error) {
        console.log(`Error checking:`, error);
      } else {
        // Check existing values in database
        const { data: existing } = await supabase
          .from('decisions')
          .select('outcome')
          .not('outcome', 'is', null)
          .limit(5);

        if (existing && existing.length > 0) {
          console.log('\nExisting outcome values in database:');
          existing.forEach(d => {
            console.log(`  - ${d.outcome}`);
          });
        } else {
          console.log('No decisions with outcome found');
        }
        break;
      }
    } catch (e) {
      console.log(`Test value "${value}":`, e.message);
    }
  }
}

checkEnum().catch(console.error);
