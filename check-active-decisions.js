const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, deleted_at, user_id, status')
    .eq('user_id', 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  console.log('Active decisions:', data?.length || 0);
  if (data) {
    data.forEach(d => console.log('-', d.title.substring(0, 60), '- Status:', d.status));
  }
  if (error) console.error('Error:', error);
})();
