/**
 * Create test data for Feature #281: Audio Recordings Downloadable
 *
 * This script creates a user with decisions that have audio_url values.
 * Since we don't have actual audio files in Supabase Storage, we'll use
 * placeholder URLs that simulate the structure.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestData() {
  const email = 'test_f281_audio_download@example.com';
  const password = 'Test1234!';

  console.log('Creating test data for Feature #281...');

  try {
    // 1. Create or get user
    let userId;
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      console.log('✓ Using existing user:', email);
    } else {
      console.log('✗ User not found. Please create user first via signup.');
      return;
    }

    // 2. Create a category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: 'Testing',
        color: '#00d4aa',
        icon: '🔊',
        decision_count: 0,
        positive_rate: 0,
        is_system: false,
      })
      .select()
      .single();

    if (categoryError) {
      console.error('Error creating category:', categoryError);
      return;
    }

    console.log('✓ Created category:', category.name);
    const categoryId = category.id;

    // 3. Create decisions with audio_url
    const decisions = [
      {
        title: 'F281_TEST: Voice Recording Decision 1',
        status: 'decided',
        audio_url: 'https://example.com/audio/decision1.mp3',
        audio_duration_seconds: 45,
        emotional_state: 'thoughtful',
        confidence_level: 4,
        category_id: categoryId,
      },
      {
        title: 'F281_TEST: Voice Recording Decision 2',
        status: 'in_progress',
        audio_url: 'https://example.com/audio/decision2.mp3',
        audio_duration_seconds: 67,
        emotional_state: 'anxious',
        confidence_level: null,
        category_id: categoryId,
      },
      {
        title: 'F281_TEST: Decision Without Audio',
        status: 'draft',
        audio_url: null,
        emotional_state: 'calm',
        confidence_level: null,
        category_id: categoryId,
      },
    ];

    for (const decision of decisions) {
      const { data: newDecision, error: decisionError } = await supabase
        .from('decisions')
        .insert({
          user_id: userId,
          ...decision,
        })
        .select()
        .single();

      if (decisionError) {
        console.error('Error creating decision:', decisionError);
      } else {
        const hasAudio = decision.audio_url ? 'with audio' : 'without audio';
        console.log(`✓ Created decision: ${newDecision.title} (${hasAudio})`);

        // Add options if decision exists
        if (newDecision && newDecision.id) {
          const { error: optionError } = await supabase
            .from('options')
            .insert([
              {
                decision_id: newDecision.id,
                name: 'Option A',
                position: 1,
                is_chosen: decision.status === 'decided',
              },
              {
                decision_id: newDecision.id,
                name: 'Option B',
                position: 2,
                is_chosen: false,
              },
            ]);

          if (optionError) {
            console.error('Error creating options:', optionError);
          }
        }
      }
    }

    // 4. Verify created data
    const { data: verifyDecisions, error: verifyError } = await supabase
      .from('decisions')
      .select('id, title, audio_url, audio_duration_seconds')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('Error verifying decisions:', verifyError);
    } else {
      console.log('\n✓ Test data created successfully!');
      console.log('\nDecisions created:');
      verifyDecisions.forEach((d, i) => {
        const audioStatus = d.audio_url ? `Audio: ${d.audio_duration_seconds}s` : 'No audio';
        console.log(`  ${i + 1}. ${d.title}`);
        console.log(`     ${audioStatus}`);
      });
    }

    // 5. Display login credentials
    console.log('\n' + '='.repeat(60));
    console.log('TEST USER CREDENTIALS:');
    console.log('='.repeat(60));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  }
}

createTestData();
