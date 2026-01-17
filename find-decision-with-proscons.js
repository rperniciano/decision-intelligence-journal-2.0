const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findDecisionWithProsCons() {
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, user_id')
    .eq('user_id', 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51')
    .is('deleted_at', null)
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  for (const decision of decisions) {
    const { data: pros, error: prosError } = await supabase
      .from('pros_cons')
      .select('*')
      .eq('decision_id', decision.id)
      .limit(5);

    if (!prosError && pros && pros.length > 0) {
      console.log('Decision:', decision.title);
      console.log('ID:', decision.id);
      console.log('Pros/Cons count:', pros.length);
      pros.forEach(pc => {
        console.log('-', pc.type, ':', pc.content);
      });
      console.log('---');
    }
  }
}

findDecisionWithProsCons();
