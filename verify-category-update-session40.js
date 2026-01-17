const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Find the updated category
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('name', 'UPDATED_CATEGORY_SESSION40')
    .single();

  if (catError) {
    console.error('Error finding category:', catError);
    return;
  }

  console.log('✅ Category found:');
  console.log('  ID:', category.id);
  console.log('  Name:', category.name);
  console.log('  Icon:', category.icon);
  console.log('  Color:', category.color);
  console.log('  Slug:', category.slug);

  // Check if any decisions are linked to this category
  const { data: decisions, error: decError } = await supabase
    .from('decisions')
    .select('id, title, category_id')
    .eq('category_id', category.id);

  console.log('\n✅ Decisions linked to this category:', decisions?.length || 0);
  if (decisions && decisions.length > 0) {
    decisions.forEach(d => {
      console.log('  -', d.title);
    });
  }
})();
