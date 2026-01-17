const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Categories:');
    data.forEach(cat => {
      console.log(`  ${cat.name} (ID: ${cat.id})`);
    });
  }
}

getCategories();
