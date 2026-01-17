const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, status')
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Existing decisions and their status values:');
    data.forEach(d => console.log(`- ${d.title}: status="${d.status}"`));
  }
})();
