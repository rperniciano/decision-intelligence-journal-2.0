const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Get the user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === 'mobiletest@example.com');
  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Found user:', user.id);

  // Create a test decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'Should I switch to remote work?',
      status: 'decided',
      description: 'Considering a fully remote position at a tech startup',
      chosen_option_id: null,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('Created decision:', decision.id);

  // Create options
  const { data: options, error: optionsError } = await supabase
    .from('options')
    .insert([
      {
        decision_id: decision.id,
        title: 'Accept remote position',
        description: 'Work from home full-time'
      },
      {
        decision_id: decision.id,
        title: 'Stay in office',
        description: 'Keep current in-office job'
      }
    ])
    .select();

  if (optionsError) {
    console.error('Error creating options:', optionsError);
    return;
  }

  console.log('Created options:', options.length);

  // Create pros/cons
  const { error: prosConsError } = await supabase
    .from('pros_cons')
    .insert([
      {
        option_id: options[0].id,
        is_pro: true,
        content: 'Better work-life balance'
      },
      {
        option_id: options[0].id,
        is_pro: false,
        content: 'Less social interaction'
      },
      {
        option_id: options[1].id,
        is_pro: true,
        content: 'Team collaboration'
      },
      {
        option_id: options[1].id,
        is_pro: false,
        content: 'Long commute'
      }
    ]);

  if (prosConsError) {
    console.error('Error creating pros/cons:', prosConsError);
    return;
  }

  console.log('Decision created successfully with options and pros/cons');
})();
