const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  // Create a new test user
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'feature213@test.com',
    password: 'password123',
    email_confirm: true,
  });

  if (error) {
    console.error('Error creating user:', error);
    return;
  }

  console.log('✅ Created test user: feature213@test.com with password: password123');
  console.log('User ID:', data.user.id);

  // Copy the test decisions from regression213 user to this new user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const sourceUser = users.find(u => u.email.includes('regression213'));

  if (sourceUser) {
    console.log('Source user ID:', sourceUser.id);

    // Get decisions from source user
    const { data: decisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', sourceUser.id);

    if (decisions && decisions.length > 0) {
      console.log(`Found ${decisions.length} decisions to copy`);

      for (const decision of decisions) {
        // Copy decision to new user
        const { data: newDecision, error: insertError } = await supabase
          .from('decisions')
          .insert({
            user_id: data.user.id,
            title: decision.title,
            status: decision.status,
            description: decision.description,
            outcome: decision.outcome,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error copying decision:', insertError);
          continue;
        }

        // Get options for this decision
        const { data: options } = await supabase
          .from('options')
          .select('*')
          .eq('decision_id', decision.id);

        if (options && options.length > 0) {
          const newOptions = [];

          for (const option of options) {
            const { data: newOption } = await supabase
              .from('options')
              .insert({
                decision_id: newDecision.id,
                title: option.title,
                display_order: option.display_order,
              })
              .select()
              .single();

            if (newOption) {
              newOptions.push(newOption);
            }
          }

          // Set chosen_option_id to the same position
          if (decision.chosen_option_id && newOptions.length > 0) {
            // Find which position was chosen
            const { data: chosenOption } = await supabase
              .from('options')
              .select('display_order')
              .eq('id', decision.chosen_option_id)
              .single();

            if (chosenOption) {
              const newChosenOption = newOptions.find(o => o.display_order === chosenOption.display_order);
              if (newChosenOption) {
                await supabase
                  .from('decisions')
                  .update({
                    chosen_option_id: newChosenOption.id,
                    decided_at: new Date().toISOString(),
                  })
                  .eq('id', newDecision.id);
              }
            }
          }
        }

        console.log(`Copied decision: ${decision.title}`);
      }

      console.log('✅ All decisions copied to new user');
    }
  }
}

createTestUser().catch(console.error);
