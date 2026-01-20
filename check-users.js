import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Recent test users (last 10):');
  const testUsers = users.filter(u => u.email.includes('test') || u.email.includes('feature')).slice(-10);

  if (testUsers.length === 0) {
    console.log('No test users found. Listing all users:');
    users.slice(-5).forEach(u => {
      console.log(`- ${u.email} (Confirmed: ${u.email_confirmed_at ? 'Yes' : 'No'})`);
    });
  } else {
    testUsers.forEach(u => {
      console.log(`- ${u.email} (Confirmed: ${u.email_confirmed_at ? 'Yes' : 'No'})`);
    });
  }
}

main();
