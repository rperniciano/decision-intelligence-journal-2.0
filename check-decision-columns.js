const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc'
);

(async () => {
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Decision columns:', Object.keys(data[0]));
  } else {
    console.log('No decisions found, inserting a test one...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === 'feature200.test@example.com');

    if (user) {
      const { data: newDecision } = await supabase
        .from('decisions')
        .insert({ user_id: user.id, title: 'Test', status: 'draft' })
        .select();
      console.log('Decision columns:', Object.keys(newDecision[0]));
    }
  }
})();
