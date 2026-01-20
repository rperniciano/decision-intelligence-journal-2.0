/**
 * Create test data for Feature #281: Audio Recordings Downloadable
 * Using correct database schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestData() {
  const email = 'test_f281_audio@example.com';
  const password = 'Test1234!';

  console.log('Creating test data for Feature #281 (Audio Download)...');

  try {
    // 1. Get user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    if (!existingUser) {
      console.error('User not found. Please create user first.');
      return;
    }

    const userId = existingUser.id;
    console.log('✓ Using existing user:', email);

    // 2. Get or create category
    let categoryId;
    const { data: existingCat } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Audio Testing')
      .single();

    if (existingCat) {
      categoryId = existingCat.id;
      console.log('✓ Using existing category');
    } else {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: 'Audio Testing',
          slug: 'audio-testing',
          color: '#8b5cf6',
          icon: '🎙️',
          is_system: false,
          display_order: 1,
        })
        .select()
        .single();

      if (categoryError) {
        console.error('Error creating category:', categoryError);
        return;
      }
      categoryId = category.id;
      console.log('✓ Category created');
    }

    // 3. Create decisions with audio URLs
    const decisions = [
      {
        title: 'F281_TEST: Job Offer Recording',
        status: 'decided',
        audio_url: 'https://example.com/audio/job-offer.mp3',
        audio_duration_seconds: 124,
        detected_emotional_state: 'excited',
        description: 'Recorded my thoughts about the new job offer',
        decided_at: new Date().toISOString(),
      },
      {
        title: 'F281_TEST: Apartment Decision Recording',
        status: 'in_progress',
        audio_url: 'https://example.com/audio/apartment.mp3',
        audio_duration_seconds: 89,
        detected_emotional_state: 'anxious',
        description: 'Still thinking about which apartment to rent',
      },
      {
        title: 'F281_TEST: Car Purchase Recording',
        status: 'draft',
        audio_url: 'https://example.com/audio/car-purchase.mp3',
        audio_duration_seconds: 156,
        detected_emotional_state: 'neutral',
        description: 'Weighed the pros and cons of buying vs leasing',
      },
      {
        title: 'F281_TEST: Decision Without Audio',
        status: 'draft',
        audio_url: null,
        detected_emotional_state: 'calm',
        description: 'This decision was created manually without recording',
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
              title: decision.status === 'decided' ? 'Accept' : 'Option A',
              display_order: 1,
              is_chosen: decision.status === 'decided',
            },
            {
              decision_id: newDecision.id,
              title: decision.status === 'decided' ? 'Decline' : 'Option B',
              display_order: 2,
              is_chosen: false,
            },
          ]);

        if (optionError) {
          console.error('Error creating options:', optionError);
        }
      }
    }

    // 4. Verify data
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
        ? `✓ Audio: ${d.audio_duration_seconds}s`
        : '✗ No audio';
      console.log(`  ${i + 1}. ${d.title}`);
      console.log(`     ${audioInfo}`);
      if (d.audio_url) {
        console.log(`     URL: ${d.audio_url}`);
      }
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

createTestData();
