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

async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    process.exit(1);
  }

  console.log('Available categories:');
  console.log('====================');
  data.forEach(cat => {
    console.log(`ID: ${cat.id} | Name: ${cat.name} | Slug: ${cat.slug} | User: ${cat.user_id ? 'Custom' : 'System'}`);
  });
}

listCategories();
