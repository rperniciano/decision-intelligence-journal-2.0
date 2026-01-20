const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyData() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email.includes('f281'));

  if (user) {
    console.log('Test user found:', user.email);

    const { data: decisions } = await supabase
      .from('decisions')
      .select('id, title, audio_url, audio_duration_seconds')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6);

    const withAudio = decisions?.filter(d => d.audio_url) || [];
    console.log('\nDecisions with audio:', withAudio.length);
    console.log('Total decisions:', decisions?.length || 0);

    console.log('\nAll decisions:');
    decisions?.forEach((d, i) => {
      const hasAudio = d.audio_url ? '✓' : '✗';
      const duration = d.audio_duration_seconds ? `(${d.audio_duration_seconds}s)` : '';
      console.log(`  ${i + 1}. ${hasAudio} ${d.title} ${duration}`);
    });
  } else {
    console.log('No F281 test user found');
  }
}

verifyData();
