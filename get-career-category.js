const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('name', 'Career')
    .single();

  console.log('Career category:', categories);
}

main();
