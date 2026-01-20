const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
const envVars = {};
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createDecision() {
  // Use the user ID we already have from the login
  const userId = 'ea816641-8b0e-44ae-a218-629c16b15663';

  // Get the category
  const { data: categoryData } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'F93 Edited Category')
    .eq('user_id', userId)
    .single();

  if (!categoryData) {
    console.log('Category not found');
    return;
  }

  console.log('Creating decision with category:', categoryData.id);

  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'F93 Test Decision',
      content: 'Testing if decisions remain linked after category edit',
      category_id: categoryData.id,
      emotional_state: 'neutral',
      confidence_level: 5,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Decision created:', data.id);
    console.log('Category ID:', data.category_id);
  }
}

createDecision();
