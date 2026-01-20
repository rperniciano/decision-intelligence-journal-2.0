// Add decision with nested data for Feature #276
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function addDecision() {
  console.log('=== Adding decision with nested data for Feature #276 ===\n');

  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test_f276@example.com',
    password: 'password123',
  });

  if (signInError) {
    console.error('Error signing in:', signInError.message);
    return;
  }

  console.log('✓ Signed in successfully');

  // Set session
  supabase.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  });

  const userId = signInData.session.user.id;
  console.log('✓ User ID:', userId);

  // 1. Create category
  console.log('\nStep 1: Creating category...');
  const { data: category, error: catError } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: 'F276_Career',
      slug: 'f276-career',
      icon: 'briefcase',
      color: '#00d4aa'
    })
    .select()
    .single();

  if (catError) {
    console.error('Error creating category:', catError);
    // Try to use existing category
    const { data: existingCats } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingCats && existingCats.length > 0) {
      console.log('Using existing category:', existingCats[0].id);
      var categoryId = existingCats[0].id;
    } else {
      console.error('No category available');
      return;
    }
  } else {
    console.log('✓ Category created:', category.id);
    var categoryId = category.id;
  }

  // 2. Create decision with outcome
  console.log('\nStep 2: Creating decision with outcome...');
  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'F276_TEST: Job Offer with Nested Data',
      description: 'Testing JSON export with complete nested structure',
      status: 'decided',
      category_id: categoryId,
      decided_at: new Date().toISOString(),
      detected_emotional_state: 'neutral',
      outcome_notes: 'F276_OUTCOME: Great decision, salary increased by 40%',
      outcome_recorded_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decError) {
    console.error('Error creating decision:', decError);
    return;
  }

  console.log('✓ Decision created:', decision.id);

  // 3. Create Option 1 with pros/cons
  console.log('\nStep 3: Creating Option 1 (chosen)...');
  const { data: opt1, error: opt1Error } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      title: 'F276: Accept the offer',
      is_chosen: true,
      description: 'Higher salary, better benefits'
    })
    .select()
    .single();

  if (opt1Error) {
    console.error('Error creating option 1:', opt1Error);
    return;
  }
  console.log('✓ Option 1 created:', opt1.id);

  // Pros for option 1
  const { error: pros1Error } = await supabase.from('pros_cons').insert([
    { option_id: opt1.id, type: 'pro', content: 'F276_PRO: 40% salary increase' },
    { option_id: opt1.id, type: 'pro', content: 'F276_PRO: Better health insurance' },
    { option_id: opt1.id, type: 'pro', content: 'F276_PRO: Remote work flexibility' },
  ]);
  if (pros1Error) {
    console.error('Error adding pros:', pros1Error);
  } else {
    console.log('  ✓ Added 3 pros');
  }

  // Cons for option 1
  const { error: cons1Error } = await supabase.from('pros_cons').insert([
    { option_id: opt1.id, type: 'con', content: 'F276_CON: Longer commute' },
    { option_id: opt1.id, type: 'con', content: 'F276_CON: New team to learn' },
  ]);
  if (cons1Error) {
    console.error('Error adding cons:', cons1Error);
  } else {
    console.log('  ✓ Added 2 cons');
  }

  // 4. Create Option 2 with pros/cons
  console.log('\nStep 4: Creating Option 2 (not chosen)...');
  const { data: opt2, error: opt2Error } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      title: 'F276: Stay at current job',
      is_chosen: false,
      description: 'Familiar environment'
    })
    .select()
    .single();

  if (opt2Error) {
    console.error('Error creating option 2:', opt2Error);
    return;
  }
  console.log('✓ Option 2 created:', opt2.id);

  // Pros for option 2
  const { error: pros2Error } = await supabase.from('pros_cons').insert([
    { option_id: opt2.id, type: 'pro', content: 'F276_PRO: Familiar team' },
    { option_id: opt2.id, type: 'pro', content: 'F276_PRO: Short commute' },
  ]);
  if (pros2Error) {
    console.error('Error adding pros:', pros2Error);
  } else {
    console.log('  ✓ Added 2 pros');
  }

  // Cons for option 2
  const { error: cons2Error } = await supabase.from('pros_cons').insert([
    { option_id: opt2.id, type: 'con', content: 'F276_CON: Lower salary' },
    { option_id: opt2.id, type: 'con', content: 'F276_CON: Limited growth' },
    { option_id: opt2.id, type: 'con', content: 'F276_CON: No remote work' },
  ]);
  if (cons2Error) {
    console.error('Error adding cons:', cons2Error);
  } else {
    console.log('  ✓ Added 3 cons');
  }

  // 5. Verify the data
  console.log('\nStep 5: Verifying nested data...');
  const { data: fullDecision, error: verifyError } = await supabase
    .from('decisions')
    .select(`
      id,
      title,
      status,
      outcome_notes,
      outcome,
      options!options_decision_id_fkey (
        id,
        title,
        is_chosen,
        pros_cons (
          id,
          type,
          content
        )
      )
    `)
    .eq('id', decision.id)
    .single();

  if (verifyError) {
    console.error('Error verifying:', verifyError);
  } else {
    console.log('\n✓ Verification complete:');
    console.log('  Decision:', fullDecision.title);
    console.log('  Status:', fullDecision.status);
    console.log('  Has outcome:', !!fullDecision.outcome_notes);
    console.log('  Outcome:', fullDecision.outcome);
    console.log('  Options:', fullDecision.options?.length || 0);

    let totalPros = 0, totalCons = 0;
    fullDecision.options?.forEach(opt => {
      console.log(`    - ${opt.title} (chosen: ${opt.is_chosen})`);
      opt.pros_cons?.forEach(pc => {
        if (pc.type === 'pro') totalPros++;
        else totalCons++;
      });
      console.log(`      Pros/Cons: ${opt.pros_cons?.length || 0}`);
    });
    console.log(`  Total pros: ${totalPros}`);
    console.log(`  Total cons: ${totalCons}`);
  }

  console.log('\n=== Ready for Feature #276 testing ===');
  console.log('User: test_f276@example.com');
  console.log('Password: password123');
}

addDecision().catch(console.error);
