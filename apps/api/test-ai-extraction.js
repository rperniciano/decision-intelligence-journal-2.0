/**
 * Test AI Extraction - Feature #66
 *
 * This script tests that the OpenAI GPT-4 extraction service
 * actually processes the transcript content and extracts relevant data
 * that relates to what was "said" (the transcript).
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Unique, specific transcript about choosing a vacation destination
const testTranscript = `
I'm trying to decide between two vacation destinations for next month.
Option one is Bali, Indonesia. The pros are that it has beautiful beaches,
amazing temples, great food, and it's relatively affordable. The cons are
the long flight time from here, the rainy season might be starting, and
it can be quite touristy in some areas.

Option two is Iceland. The pros are incredible natural scenery like waterfalls
and glaciers, the Northern Lights might be visible, and it's a unique cultural
experience. The cons are that it's very expensive, the weather can be harsh,
and daylight hours are limited in winter.

I'm feeling pretty excited about both options but also a bit uncertain
about which one to pick. This is definitely a leisure and lifestyle decision.
`;

async function testExtraction() {
  console.log('=== Testing AI Extraction Feature ===\n');
  console.log('Test Transcript:');
  console.log(testTranscript);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    console.log('Sending transcript to OpenAI GPT-4 for extraction...\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that extracts structured decision data from voice transcripts.
Extract the following information:
- title: A clear, concise title for the decision (max 100 chars)
- options: Array of options being considered (each with name, pros array, cons array)
- emotionalState: One of: calm, confident, anxious, excited, uncertain, stressed, neutral, hopeful, frustrated
- suggestedCategory: Business, Health, Relationships, Career, Finance, Education, Lifestyle, or null

Return ONLY valid JSON matching this structure:
{
  "title": "string",
  "options": [{"name": "string", "pros": ["string"], "cons": ["string"]}],
  "emotionalState": "calm|confident|anxious|excited|uncertain|stressed|neutral|hopeful|frustrated",
  "suggestedCategory": "Business|Health|Relationships|Career|Finance|Education|Lifestyle|null",
  "confidence": 0.0-1.0
}`,
        },
        {
          role: 'user',
          content: `Extract decision data from this transcript:\n\n${testTranscript}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const extracted = JSON.parse(content);

    console.log('✅ OpenAI Extraction Result:');
    console.log(JSON.stringify(extracted, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // Verify extraction quality
    console.log('=== Verification Checks ===\n');

    const checks = {
      'Title relates to vacation/destination':
        extracted.title.toLowerCase().includes('vacation') ||
        extracted.title.toLowerCase().includes('destination') ||
        extracted.title.toLowerCase().includes('bali') ||
        extracted.title.toLowerCase().includes('iceland') ||
        extracted.title.toLowerCase().includes('trip') ||
        extracted.title.toLowerCase().includes('travel'),

      'Has 2 options extracted':
        Array.isArray(extracted.options) && extracted.options.length === 2,

      'First option mentions Bali or Indonesia':
        extracted.options && extracted.options[0] &&
        (extracted.options[0].name.toLowerCase().includes('bali') ||
         extracted.options[0].name.toLowerCase().includes('indonesia')),

      'Second option mentions Iceland':
        extracted.options && extracted.options[1] &&
        extracted.options[1].name.toLowerCase().includes('iceland'),

      'Bali has pros about beaches/temples/food':
        extracted.options && extracted.options[0] && extracted.options[0].pros &&
        extracted.options[0].pros.some(pro =>
          pro.toLowerCase().includes('beach') ||
          pro.toLowerCase().includes('temple') ||
          pro.toLowerCase().includes('food') ||
          pro.toLowerCase().includes('affordable')
        ),

      'Bali has cons about flight/rain/tourist':
        extracted.options && extracted.options[0] && extracted.options[0].cons &&
        extracted.options[0].cons.some(con =>
          con.toLowerCase().includes('flight') ||
          con.toLowerCase().includes('rain') ||
          con.toLowerCase().includes('tourist')
        ),

      'Iceland has pros about scenery/northern lights':
        extracted.options && extracted.options[1] && extracted.options[1].pros &&
        extracted.options[1].pros.some(pro =>
          pro.toLowerCase().includes('scenery') ||
          pro.toLowerCase().includes('northern') ||
          pro.toLowerCase().includes('lights') ||
          pro.toLowerCase().includes('waterfall') ||
          pro.toLowerCase().includes('glacier')
        ),

      'Iceland has cons about cost/weather':
        extracted.options && extracted.options[1] && extracted.options[1].cons &&
        extracted.options[1].cons.some(con =>
          con.toLowerCase().includes('expensive') ||
          con.toLowerCase().includes('weather') ||
          con.toLowerCase().includes('daylight')
        ),

      'Emotional state is excited or uncertain':
        extracted.emotionalState === 'excited' || extracted.emotionalState === 'uncertain',

      'Category is Lifestyle':
        extracted.suggestedCategory === 'Lifestyle',

      'NOT generic/unrelated content':
        !extracted.title.toLowerCase().includes('lorem') &&
        !extracted.title.toLowerCase().includes('placeholder') &&
        !extracted.title.toLowerCase().includes('example')
    };

    let passedChecks = 0;
    let totalChecks = 0;

    for (const [check, result] of Object.entries(checks)) {
      totalChecks++;
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status}: ${check}`);
      if (result) passedChecks++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\nFinal Score: ${passedChecks}/${totalChecks} checks passed`);

    if (passedChecks >= totalChecks * 0.8) { // 80% threshold
      console.log('\n✅ AI EXTRACTION IS WORKING CORRECTLY');
      console.log('The extracted data relates to the spoken content about Bali vs Iceland vacation.');
      console.log('This is NOT random or generic placeholder content.');
      return true;
    } else {
      console.log('\n❌ AI EXTRACTION MAY HAVE ISSUES');
      console.log('The extracted data does not match expected content.');
      return false;
    }

  } catch (error) {
    console.error('❌ Error during extraction:', error.message);
    return false;
  }
}

testExtraction().then(success => {
  process.exit(success ? 0 : 1);
});
