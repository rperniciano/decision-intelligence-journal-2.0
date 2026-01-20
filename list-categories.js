import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Categories in Database ===');
  data.forEach(cat => {
    console.log(`ID: ${cat.id}, Name: ${cat.name}`);
  });
}

listCategories().catch(console.error);
