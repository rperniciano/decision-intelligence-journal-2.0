/**
 * Create complete test data for Feature #281: Audio Recordings Downloadable
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createCompleteTestData() {
  const email = 'test_f281_audio@example.com';
  const password = 'Test1234!';

  console.log('Creating test data for Feature #281 (Audio Download)...');

  try {
    // 1. Create user via auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError && !authError.message.includes('already exists')) {
      console.error('Error creating auth user:', authError);
      return;
    }

    let userId;
    if (authData?.user) {
      userId = authData.user.id;
      console.log('✓ Created auth user:', email);
    } else {
      // Get existing user
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log('✓ Using existing user:', email);
      } else {
        console.error('Could not find or create user');
        return;
      }
    }

    // 2. Create profile if not exists
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: 'Audio Test User',
        email: email,
        avatar_url: null,
        decision_score: 50,
        total_decisions: 0,
        positive_outcome_rate: 0,
      });

    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Error creating profile:', profileError);
    } else {
      console.log('✓ Profile ready');
    }

    // 3. Create category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: 'Audio Testing',
        color: '#8b5cf6',
        icon: '🎙️',
        decision_count: 0,
        positive_rate: 0,
        is_system: false,
      })
      .select()
      .single();

    if (categoryError && !categoryError.message.includes('duplicate')) {
      console.error('Error creating category:', categoryError);
      return;
    }

    const categoryId = category?.id;
    console.log('✓ Category created');

    // 4. Create decisions with audio URLs
    const decisions = [
      {
        title: 'F281_TEST: Job Offer Recording',
        status: 'decided',
        audio_url: 'https://example.com/audio/job-offer.mp3',
        audio_duration_seconds: 124,
        emotional_state: 'excited',
        confidence_level: 5,
        notes: 'Recorded my thoughts about the new job offer',
      },
      {
        title: 'F281_TEST: Apartment Decision Recording',
        status: 'in_progress',
        audio_url: 'https://example.com/audio/apartment.mp3',
        audio_duration_seconds: 89,
        emotional_state: 'anxious',
        confidence_level: null,
        notes: 'Still thinking about which apartment to rent',
      },
      {
        title: 'F281_TEST: Car Purchase Recording',
        status: 'deliberating',
        audio_url: 'https://example.com/audio/car-purchase.mp3',
        audio_duration_seconds: 156,
        emotional_state: 'thoughtful',
        confidence_level: null,
        notes: 'Weighed the pros and cons of buying vs leasing',
      },
      {
        title: 'F281_TEST: Decision Without Audio',
        status: 'draft',
        audio_url: null,
        emotional_state: 'calm',
        confidence_level: null,
        notes: 'This decision was created manually without recording',
      },
    ];

    for (const decision of decisions) {
      const { data: newDecision, error: decisionError } = await supabase
        .from('decisions')
        .insert({
          user_id: userId,
          category_id: categoryId,
          ...decision,
        })
        .select()
        .single();

      if (decisionError) {
        console.error('Error creating decision:', decisionError);
      } else if (newDecision) {
        const hasAudio = decision.audio_url ? `(${decision.audio_duration_seconds}s audio)` : '(no audio)';
        console.log(`✓ Created: ${newDecision.title} ${hasAudio}`);

        // Add options for each decision
        const { error: optionError } = await supabase
          .from('options')
          .insert([
            {
              decision_id: newDecision.id,
              name: decision.status === 'decided' ? 'Accept' : 'Option A',
              position: 1,
              is_chosen: decision.status === 'decided',
            },
            {
              decision_id: newDecision.id,
              name: decision.status === 'decided' ? 'Decline' : 'Option B',
              position: 2,
              is_chosen: false,
            },
          ]);

        if (optionError) {
          console.error('Error creating options:', optionError);
        }
      }
    }

    // 5. Verify data
    const { data: verifyDecisions } = await supabase
      .from('decisions')
      .select('id, title, audio_url, audio_duration_seconds')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('\n' + '='.repeat(60));
    console.log('TEST DATA CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\nDecisions:');
    verifyDecisions.forEach((d, i) => {
      const audioInfo = d.audio_url
        ? `✓ Audio: ${d.audio_duration_seconds}s - ${d.audio_url}`
        : '✗ No audio';
      console.log(`  ${i + 1}. ${d.title}`);
      console.log(`     ${audioInfo}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  }
}

createCompleteTestData();
