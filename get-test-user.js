const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log(data[0].email);
  }
})();
