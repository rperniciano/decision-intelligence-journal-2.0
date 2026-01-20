const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load .env
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: decisions } = await supabase
    .from('decisions')
    .select('id, title, user_id, status')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!decisions || decisions.length === 0) {
    console.log('No decisions found');
    return;
  }

  const decision = decisions[0];

  // Get user from auth
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users?.find(u => u.id === decision.user_id);

  console.log('========================================');
  console.log('Using existing test data:');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Status:', decision.status);
  console.log('User Email:', user?.email || 'unknown');
  console.log('Password: (probably Test1234)');
  console.log('========================================');
}

main().catch(console.error);
