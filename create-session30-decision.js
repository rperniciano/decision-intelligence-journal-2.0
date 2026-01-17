import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDecision() {
  // Get session30 user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === 'session30test@example.com');

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Creating decision for user:', user.id);

  // Get a category ID (Personal)
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Personal')
    .single();

  const categoryId = categories?.id;

  // Create decision
  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      category_id: categoryId,
      title: 'Test Decision for Breadcrumb Verification',
      status: 'decided',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating decision:', error);
    return;
  }

  console.log('✅ Decision created successfully');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Status:', decision.status);
}

createDecision();
