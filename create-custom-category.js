import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createCustomCategory() {
  const userId = '94bd67cb-b094-4387-a9c8-26b0c65904cd'; // mobiletest user
  const categoryName = 'MY_CUSTOM_CAT_123';

  const { data: category, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: categoryName,
      slug: categoryName.toLowerCase().replace(/_/g, '-'),
      icon: '📁', // default icon
      color: '#00d4aa', // teal accent color
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    process.exit(1);
  }

  console.log('Category created successfully!');
  console.log('Category ID:', category.id);
  console.log('Name:', category.name);
  console.log('User ID:', category.user_id);
  console.log('\nYou can now verify this category appears in the category dropdown.');
}

createCustomCategory();
