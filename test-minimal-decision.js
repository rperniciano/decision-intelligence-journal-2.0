import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = 'feature218@test.com';

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  // Try minimal insert
  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'Test Minimal',
      status: 'reviewed',
      category: 'Test',
      options: [],
    })
    .select();

  console.log('Error:', error ? error.message : 'None');
  console.log('Data:', data);
}

test();
