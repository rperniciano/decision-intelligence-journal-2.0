const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('All categories:');
  categories.forEach(cat => {
    console.log(`  ${cat.name}: ${cat.id}`);
  });
}

main();
