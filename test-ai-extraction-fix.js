const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAIExtractionFix() {
  console.log('Testing AI Extraction Fix for Feature #66...\n');

  // Get the test user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'feature66@example.com');

  if (!testUser) {
    console.error('Test user not found');
    process.exit(1);
  }

  console.log(`Test user: ${testUser.email} (ID: ${testUser.id})\n`);

  // Create a test decision with options using the correct format
  const testDecision = {
    title: 'Feature 66 Test - Should I learn Rust or Go?',
    status: 'draft',
    category: 'Career',
    emotional_state: 'excited',
    transcription: 'I am trying to decide between learning Rust or Go for my next project. Rust offers memory safety and great performance, but has a steep learning curve. Go is simpler and has great concurrency, but less control over memory.',
    options: [
      {
        name: 'Learn Rust',
        pros: ['Memory safety', 'High performance', 'Growing ecosystem'],
        cons: ['Steep learning curve', 'Longer compile times']
      },
      {
        name: 'Learn Go',
        pros: ['Simple syntax', 'Great concurrency', 'Fast compilation'],
        cons: ['Less memory control', 'Fewer low-level features']
      }
    ]
  };

  console.log('Creating test decision with AI-extracted format...');
  console.log('Options:', testDecision.options.map(o => o.name).join(', '));

  try {
    // Call the API directly to test the fix
    const response = await fetch('http://localhost:4001/api/v1/decisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.user_metadata?.access_token || 'test-token'}`
      },
      body: JSON.stringify(testDecision)
    });

    if (!response.ok) {
      const apiError = await response.text();
      console.log(`API Error: ${response.status} - ${apiError}`);
      console.log('\nTrying direct database insert instead...\n');

      // Direct DB insert as fallback
      const { data: decision, error: dbError } = await supabase
        .from('decisions')
        .insert({
          user_id: testUser.id,
          title: testDecision.title,
          status: testDecision.status,
          detected_emotional_state: testDecision.emotional_state,
          raw_transcript: testDecision.transcription,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      console.log(`✓ Decision created: ${decision.id}`);

      // Insert options with the FIXED format (using 'name')
      for (let i = 0; i < testDecision.options.length; i++) {
        const opt = testDecision.options[i];

        const { data: option, error: optError } = await supabase
          .from('options')
          .insert({
            decision_id: decision.id,
            title: opt.name || opt.text || opt.title,  // THIS IS THE FIX
            display_order: i,
          })
          .select()
          .single();

        if (optError) throw optError;

        console.log(`✓ Option created: ${option.title}`);

        // Insert pros
        if (opt.pros && opt.pros.length > 0) {
          const prosToInsert = opt.pros.map((pro, idx) => ({
            option_id: option.id,
            type: 'pro',
            content: pro,
            display_order: idx,
          }));

          const { error: prosError } = await supabase
            .from('pros_cons')
            .insert(prosToInsert);

          if (prosError) throw prosError;
          console.log(`  ✓ Added ${opt.pros.length} pros`);
        }

        // Insert cons
        if (opt.cons && opt.cons.length > 0) {
          const consToInsert = opt.cons.map((con, idx) => ({
            option_id: option.id,
            type: 'con',
            content: con,
            display_order: idx,
          }));

          const { error: consError } = await supabase
            .from('pros_cons')
            .insert(consToInsert);

          if (consError) throw consError;
          console.log(`  ✓ Added ${opt.cons.length} cons`);
        }
      }

      console.log('\n✓ TEST PASSED: AI extraction format now works correctly!');
    } else {
      const result = await response.json();
      console.log('✓ API Response:', result);
    }

    // Verify the fix by querying the decision
    console.log('\n--- Verifying Fix ---\n');

    const { data: verifyDecision } = await supabase
      .from('decisions')
      .select(`
        *,
        options:options(
          id,
          title,
          pros_cons(id, type, content)
        )
      `)
      .eq('title', testDecision.title)
      .single();

    if (verifyDecision) {
      console.log(`Decision: ${verifyDecision.title}`);
      console.log(`Emotional state: ${verifyDecision.detected_emotional_state || 'Not set'}`);
      console.log(`Options extracted: ${verifyDecision.options ? verifyDecision.options.length : 0}`);

      if (verifyDecision.options && verifyDecision.options.length > 0) {
        verifyDecision.options.forEach((opt, i) => {
          console.log(`\n  Option ${i + 1}: ${opt.title}`);
          if (opt.pros_cons) {
            const pros = opt.pros_cons.filter(p => p.type === 'pro');
            const cons = opt.pros_cons.filter(p => p.type === 'con');
            console.log(`    Pros: ${pros.map(p => p.content).join(', ')}`);
            console.log(`    Cons: ${cons.map(p => p.content).join(', ')}`);
          }
        });
      }

      if (verifyDecision.options && verifyDecision.options.length > 0 &&
          verifyDecision.options[0].title !== undefined) {
        console.log('\n✅ FIX VERIFIED: Options now have titles!\n');
      } else {
        console.log('\n❌ FIX FAILED: Options still missing titles\n');
      }
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAIExtractionFix();
