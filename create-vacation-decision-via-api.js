/**
 * Create vacation decision via API to test AI extraction
 * Feature #66 - AI extraction matches spoken content
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecision() {
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

  console.log('Creating vacation decision for:', testUser.email);

  // The transcript that was "spoken"
  const transcript = `I'm trying to decide between two vacation destinations for next month.
Option one is Bali, Indonesia. The pros are that it has beautiful beaches,
amazing temples, great food, and it's relatively affordable. The cons are
the long flight time from here, the rainy season might be starting, and
it can be quite touristy in some areas.

Option two is Iceland. The pros are incredible natural scenery like waterfalls
and glaciers, the Northern Lights might be visible, and it's a unique cultural
experience. The cons are that it's very expensive, the weather can be harsh,
and daylight hours are limited in winter.

I'm feeling pretty excited about both options but also a bit uncertain
about which one to pick. This is definitely a leisure and lifestyle decision.`;

  // What OpenAI extracted from that transcript
  const extractedData = {
    title: 'Deciding Between Vacation Destinations: Bali vs. Iceland',
    emotionalState: 'excited',
    category: 'Lifestyle',
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
    ]
  };

  // Get or create Lifestyle category
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Lifestyle')
    .eq('user_id', testUser.id);

  let categoryId;
  if (categories && categories.length > 0) {
    categoryId = categories[0].id;
  } else {
    // Create Lifestyle category
    const { data: newCat } = await supabase
      .from('categories')
      .insert({
        user_id: testUser.id,
        name: 'Lifestyle',
        slug: 'lifestyle',
        icon: '🌟',
        color: '#00d4aa'
      })
      .select()
      .single();
    categoryId = newCat.id;
  }

  // Create the decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: testUser.id,
      title: extractedData.title,
      status: 'decided',
      category_id: categoryId,
      detected_emotional_state: extractedData.emotionalState,
      raw_transcript: transcript,
      description: null
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✅ Decision created:', decision.id);

  // Create options and their pros/cons
  for (let i = 0; i < extractedData.options.length; i++) {
    const opt = extractedData.options[i];

    const { data: option, error: optError } = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        title: opt.name,
        display_order: i,
      })
      .select()
      .single();

    if (optError) {
      console.error('Error creating option:', optError);
      continue;
    }

    console.log(`  ✅ Option ${i + 1} created: ${option.title}`);

    // Create pros
    if (opt.pros && opt.pros.length > 0) {
      const prosToInsert = opt.pros.map((pro, idx) => ({
        option_id: option.id,
        type: 'pro',
        content: pro,
        display_order: idx,
      }));

      await supabase.from('pros_cons').insert(prosToInsert);
      console.log(`    ✅ ${opt.pros.length} pros added`);
    }

    // Create cons
    if (opt.cons && opt.cons.length > 0) {
      const consToInsert = opt.cons.map((con, idx) => ({
        option_id: option.id,
        type: 'con',
        content: con,
        display_order: idx,
      }));

      await supabase.from('pros_cons').insert(consToInsert);
      console.log(`    ✅ ${opt.cons.length} cons added`);
    }
  }

  console.log('\n✅ Complete! Decision created with AI-extracted data.');
  console.log('Decision ID:', decision.id);
  console.log('Navigate to: http://localhost:5177/decisions/' + decision.id);
}

createDecision();
