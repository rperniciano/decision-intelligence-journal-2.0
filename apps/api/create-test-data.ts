// Create test decision data
import { DecisionService } from './src/services/decisionService';

async function main() {
  try {
    // Get the test user ID - we created testdev@example.com
    const userId = '1bcace3d-315a-4c2f-8751-e950fb21ff14';

    const decision = await DecisionService.createDecision(userId, {
      title: 'Should I switch to TypeScript?',
      status: 'deliberating',
      category: 'Career',
      emotional_state: 'curious',
      options: [
        {
          id: 'opt1',
          text: 'Learn TypeScript',
          pros: ['Better type safety', 'Industry standard', 'Improved IDE support'],
          cons: ['Learning curve', 'More verbose code']
        },
        {
          id: 'opt2',
          text: 'Stay with JavaScript',
          pros: ['Already familiar', 'Faster development'],
          cons: ['Harder to catch bugs', 'Less tooling support']
        }
      ],
      notes: 'Important decision for my career growth',
      transcription: 'I have been thinking about whether I should invest time in learning TypeScript...'
    });

    console.log('✅ Created test decision:');
    console.log('   ID:', decision.id);
    console.log('   Title:', decision.title);
    console.log('   Options:', decision.options.length);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
