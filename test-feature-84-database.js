const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = 'aed0f408-9e46-44a7-954f-cb668279a940';
const decisionId = '06ba83fb-ef3f-4aed-9bb4-dae194a5fec5';
const optionAlphaId = '300cd0ab-8cf5-4b05-93a1-d737c6cbc0b5';
const optionBetaId = 'e730b4b3-5583-4178-b482-40c3e1333b91';

async function testFeature84() {
  console.log('=== Feature #84: Update decision pros/cons ===\n');

  // Step 1: Get initial state
  console.log('Step 1: Get initial pros/cons state');
  const { data: initialProsCons } = await supabase
    .from('pros_cons')
    .select('*')
    .in('option_id', [optionAlphaId, optionBetaId])
    .order('type')
    .order('display_order');

  console.log('Initial pros/cons count:', initialProsCons.length);
  initialProsCons.forEach(pc => {
    console.log(`  ${pc.type}: "${pc.content}" (ID: ${pc.id})`);
  });

  // Step 2: Add a new pro to Option Alpha
  console.log('\nStep 2: Add new pro to Option Alpha');
  const { data: newPro, error: addProError } = await supabase
    .from('pros_cons')
    .insert({
      option_id: optionAlphaId,
      type: 'pro',
      content: 'NEW Pro - Added in Session 34',
      weight: 5,
      ai_extracted: false,
      display_order: 2
    })
    .select()
    .single();

  if (addProError) {
    console.error('Error adding pro:', addProError);
    return;
  }
  console.log('✓ Added pro:', newPro.content);
  console.log('  ID:', newPro.id);

  // Step 3: Add a new con to Option Beta
  console.log('\nStep 3: Add new con to Option Beta');
  const { data: newCon, error: addConError } = await supabase
    .from('pros_cons')
    .insert({
      option_id: optionBetaId,
      type: 'con',
      content: 'NEW Con - Added in Session 34',
      weight: 5,
      ai_extracted: false,
      display_order: 2
    })
    .select()
    .single();

  if (addConError) {
    console.error('Error adding con:', addConError);
    return;
  }
  console.log('✓ Added con:', newCon.content);
  console.log('  ID:', newCon.id);

  // Step 4: Edit existing pro/con text
  console.log('\nStep 4: Edit existing pro text');
  const existingProId = initialProsCons.find(pc => pc.type === 'pro' && pc.option_id === optionAlphaId)?.id;

  const { data: updatedPro, error: updateError } = await supabase
    .from('pros_cons')
    .update({
      content: 'EDITED Pro 1 - Alpha (Modified in Session 34)'
    })
    .eq('id', existingProId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating pro:', updateError);
    return;
  }
  console.log('✓ Updated pro:', updatedPro.content);

  // Step 5: Delete a pro/con
  console.log('\nStep 5: Delete a con');
  const existingConId = initialProsCons.find(pc => pc.type === 'con' && pc.option_id === optionBetaId)?.id;

  const { error: deleteError } = await supabase
    .from('pros_cons')
    .delete()
    .eq('id', existingConId);

  if (deleteError) {
    console.error('Error deleting con:', deleteError);
    return;
  }
  console.log('✓ Deleted con with ID:', existingConId);

  // Step 6: Verify all changes persisted
  console.log('\nStep 6: Verify all changes persisted');
  const { data: finalProsCons } = await supabase
    .from('pros_cons')
    .select('*')
    .in('option_id', [optionAlphaId, optionBetaId])
    .order('option_id')
    .order('type')
    .order('display_order');

  console.log('\n=== Final State ===');
  console.log('Total pros/cons:', finalProsCons.length);

  console.log('\nOption Alpha:');
  const alphaPros = finalProsCons.filter(pc => pc.option_id === optionAlphaId && pc.type === 'pro');
  const alphaCons = finalProsCons.filter(pc => pc.option_id === optionAlphaId && pc.type === 'con');
  console.log(`  Pros (${alphaPros.length}):`);
  alphaPros.forEach(p => console.log(`    - ${p.content}`));
  console.log(`  Cons (${alphaCons.length}):`);
  alphaCons.forEach(c => console.log(`    - ${c.content}`));

  console.log('\nOption Beta:');
  const betaPros = finalProsCons.filter(pc => pc.option_id === optionBetaId && pc.type === 'pro');
  const betaCons = finalProsCons.filter(pc => pc.option_id === optionBetaId && pc.type === 'con');
  console.log(`  Pros (${betaPros.length}):`);
  betaPros.forEach(p => console.log(`    - ${p.content}`));
  console.log(`  Cons (${betaCons.length}):`);
  betaCons.forEach(c => console.log(`    - ${c.content}`));

  console.log('\n=== Verification Results ===');
  const addedProExists = finalProsCons.some(pc => pc.content === 'NEW Pro - Added in Session 34');
  const addedConExists = finalProsCons.some(pc => pc.content === 'NEW Con - Added in Session 34');
  const editedProExists = finalProsCons.some(pc => pc.content === 'EDITED Pro 1 - Alpha (Modified in Session 34)');
  const deletedConGone = !finalProsCons.some(pc => pc.id === existingConId);

  console.log('✓ Added pro exists:', addedProExists);
  console.log('✓ Added con exists:', addedConExists);
  console.log('✓ Edited pro exists:', editedProExists);
  console.log('✓ Deleted con removed:', deletedConGone);

  const allTestsPassed = addedProExists && addedConExists && editedProExists && deletedConGone;

  if (allTestsPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Feature #84 verified via database.');
  } else {
    console.log('\n❌ Some tests failed.');
  }

  return {
    newProId: newPro.id,
    newConId: newCon.id,
    updatedProId: existingProId,
    deletedConId: existingConId,
    allTestsPassed
  };
}

testFeature84().then(result => {
  if (result?.allTestsPassed) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});
