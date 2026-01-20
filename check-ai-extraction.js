const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecisionsWithExtraction() {
  console.log('Checking for decisions with AI-extracted data...\n');

  // Get decisions that have a transcription (created via voice recording)
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .not('raw_transcript', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching decisions:', error);
    process.exit(1);
  }

  if (!decisions || decisions.length === 0) {
    console.log('No decisions with transcriptions found.');
    console.log('This means no voice recordings have been processed yet.\n');

    // Check if there are ANY decisions at all
    const { count } = await supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true });

    console.log(`Total decisions in database: ${count}\n`);

    if (count && count > 0) {
      console.log('Getting a sample of all decisions to check structure:\n');
      const { data: allDecisions } = await supabase
        .from('decisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (allDecisions) {
        allDecisions.forEach((d, i) => {
          console.log(`${i + 1}. ${d.title}`);
          console.log(`   Transcription: ${d.raw_transcript ? 'Yes' : 'No'}`);
          console.log(`   Audio URL: ${d.audio_url ? 'Yes' : 'No'}`);
          console.log(`   Emotional state: ${d.emotional_state || 'Not set'}`);
          console.log(`   Category: ${d.category || 'Not set'}\n`);
        });
      }
    }
    return;
  }

  console.log(`Found ${decisions.length} decisions with transcriptions (voice recordings):\n`);

  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i];
    console.log(`${i + 1}. Decision ID: ${d.id}`);
    console.log(`   Title: ${d.title}`);
    console.log(`   Category: ${d.category || 'Not extracted'}`);
    console.log(`   Emotional State: ${d.emotional_state || 'Not extracted'}`);
    console.log(`   Status: ${d.status}`);

    // Get options for this decision
    const { data: options } = await supabase
      .from('decision_options')
      .select('*')
      .eq('decision_id', d.id);

    console.log(`   Options extracted: ${options ? options.length : 0}`);

    if (options && options.length > 0) {
      options.forEach((opt, j) => {
        console.log(`      Option ${j + 1}: ${opt.name}`);
        if (opt.pros && opt.pros.length > 0) {
          console.log(`         Pros: ${opt.pros.join(', ')}`);
        }
        if (opt.cons && opt.cons.length > 0) {
          console.log(`         Cons: ${opt.cons.join(', ')}`);
        }
      });
    }

    console.log(`   Transcription length: ${d.raw_transcript ? d.raw_transcript.length : 0} chars`);
    console.log(`   Transcription preview: ${d.raw_transcript ? d.raw_transcript.substring(0, 200) + '...' : 'None'}`);
    console.log(`   Audio duration: ${d.audio_duration_seconds ? d.audio_duration_seconds + 's' : 'Unknown'}`);
    console.log(`   Created: ${d.created_at}\n`);
  }

  console.log('\n=== ANALYSIS ===');
  const decisionsWithOptions = decisions.filter(d => {
    // This is a simplified check - in reality we'd need to query options table
    return true;
  });

  console.log(`Total voice-recorded decisions: ${decisions.length}`);
}

checkDecisionsWithExtraction();
