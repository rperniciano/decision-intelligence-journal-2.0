import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCategories() {
  const userId = '94bd67cb-b094-4387-a9c8-26b0c65904cd'; // mobiletest user

  // Check if categories table exists and get user's categories
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    console.log('\nThis might mean the categories table does not exist yet.');
    process.exit(1);
  }

  console.log('\n=== USER CATEGORIES ===');
  console.log(`Total categories for user: ${categories.length}`);
  if (categories.length > 0) {
    categories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id})`);
    });
  } else {
    console.log('No categories found for this user.');
  }

  // Check if there are any system/default categories
  const { data: allCategories, error: allError } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (!allError) {
    console.log('\n=== ALL CATEGORIES IN DATABASE ===');
    console.log(`Total: ${allCategories.length}`);
    allCategories.forEach(cat => {
      console.log(`- ${cat.name} | User: ${cat.user_id || 'SYSTEM'}`);
    });
  }
}

checkCategories();
