import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getUserId(email) {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const user = users.find(u => u.email === email);
  return user?.id;
}

async function addDecisions() {
  const email = 'f110-loading-test@example.com';
  const userId = await getUserId(email);

  if (!userId) {
    console.log('User not found');
    return;
  }

  console.log('Using user:', userId);

  // Get a category
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  const categoryId = categories?.[0]?.id;

  if (!categoryId) {
    console.log('No categories found');
    return;
  }

  // Create a test decision
  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'Loading State Test Decision',
      description: 'This decision is for testing loading states in Feature #110',
      context: 'Testing loading indicators',
      status: 'considering',
      category_id: categoryId,
      decision_score: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.log('Error creating decision:', error.message);
    return;
  }

  console.log('Created decision:', decision.id);
  console.log('Title:', decision.title);
}

addDecisions();
