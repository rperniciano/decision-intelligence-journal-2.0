/**
 * Create test decision for Feature #66
 * Verifies AI extraction matches spoken content
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  // Get session18test user
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  const testUser = users.find(u => u.email === 'session18test@example.com');
  if (!testUser) {
    console.error('Test user not found');
    return;
  }

  console.log('Creating decision for user:', testUser.email);

  // Create decision with AI-extracted data from our vacation test
  // This simulates what would happen after voice recording → transcription → AI extraction
  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: testUser.id,
      title: 'Deciding Between Vacation Destinations: Bali vs. Iceland',
      status: 'decided',
      category: 'Lifestyle',
      emotional_state: 'excited',
      raw_transcript: `I'm trying to decide between two vacation destinations for next month.
Option one is Bali, Indonesia. The pros are that it has beautiful beaches,
amazing temples, great food, and it's relatively affordable. The cons are
the long flight time from here, the rainy season might be starting, and
it can be quite touristy in some areas.

Option two is Iceland. The pros are incredible natural scenery like waterfalls
and glaciers, the Northern Lights might be visible, and it's a unique cultural
experience. The cons are that it's very expensive, the weather can be harsh,
and daylight hours are limited in winter.

I'm feeling pretty excited about both options but also a bit uncertain
about which one to pick. This is definitely a leisure and lifestyle decision.`,
      options: [
        {
          name: 'Bali, Indonesia',
          pros: [
            'Beautiful beaches',
            'Amazing temples',
            'Great food',
            'Relatively affordable'
          ],
          cons: [
            'Long flight time',
            'Rainy season might be starting',
            'Can be quite touristy in some areas'
          ]
        },
        {
          name: 'Iceland',
          pros: [
            'Incredible natural scenery like waterfalls and glaciers',
            'Northern Lights might be visible',
            'Unique cultural experience'
          ],
          cons: [
            'Very expensive',
            'Weather can be harsh',
            'Daylight hours are limited in winter'
          ]
        }
      ],
      ai_confidence_score: 0.7,
      final_choice: null,
      outcome: null,
      outcome_notes: null,
      outcome_recorded_at: null,
      audio_url: null,
      audio_duration_seconds: null
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating decision:', error);
    return;
  }

  console.log('\n✅ Decision created successfully!');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Category:', decision.category);
  console.log('Emotional State:', decision.emotional_state);
  console.log('Options:', decision.options.length, 'options');
  console.log('\nOption 1:', decision.options[0].name);
  console.log('  Pros:', decision.options[0].pros.join(', '));
  console.log('  Cons:', decision.options[0].cons.join(', '));
  console.log('\nOption 2:', decision.options[1].name);
  console.log('  Pros:', decision.options[1].pros.join(', '));
  console.log('  Cons:', decision.options[1].cons.join(', '));
}

createTestDecision();
