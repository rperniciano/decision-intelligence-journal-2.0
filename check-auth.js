const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Try to get user from auth
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.log('Error:', error.message);
  } else if (users && users.length > 0) {
    console.log('Found user:', users[0].email);
  } else {
    console.log('No users found');
  }
})();
