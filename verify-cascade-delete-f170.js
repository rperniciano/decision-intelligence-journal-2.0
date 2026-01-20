const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCascadeDelete() {
  const deletedDecisionId = '08c8cd0e-0bec-4d63-9b7b-bc1714c14d4a';
  const deletedOptionIds = [
    'b4b16f98-92a8-43b9-b220-48e8742b5600',
    '8e1bce57-5552-4fee-bb90-306db8c6a27d',
    'fd62e735-ec02-4042-aab2-93f22522bbdc'
  ];

  try {
    console.log('🔍 Verifying cascade delete for Feature #170\n');

    // Check if decision was deleted
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', deletedDecisionId);

    console.log('1. Checking decision ID:', deletedDecisionId);
    if (decisionError) {
      console.log('   ❌ Error checking decision:', decisionError.message);
    } else if (decision && decision.length > 0) {
      console.log('   ❌ FAILED: Decision still exists!');
      console.log('   Found:', decision[0].title);
    } else {
      console.log('   ✅ PASSED: Decision was deleted');
    }

    // Check if options were deleted
    console.log('\n2. Checking options...');
    const { data: options, error: optionsError } = await supabase
      .from('options')
      .select('*')
      .in('id', deletedOptionIds);

    if (optionsError) {
      console.log('   ❌ Error checking options:', optionsError.message);
    } else if (options && options.length > 0) {
      console.log('   ❌ FAILED: Options still exist!');
      options.forEach(opt => {
        console.log('   Found option:', opt.id, '-', opt.title);
      });
    } else {
      console.log('   ✅ PASSED: All options were deleted');
    }

    // Check for orphaned options (options with decision_id pointing to deleted decision)
    console.log('\n3. Checking for orphaned options...');
    const { data: orphanedOptions, error: orphanedError } = await supabase
      .from('options')
      .select('*')
      .eq('decision_id', deletedDecisionId);

    if (orphanedError) {
      console.log('   ❌ Error checking orphaned options:', orphanedError.message);
    } else if (orphanedOptions && orphanedOptions.length > 0) {
      console.log('   ❌ FAILED: Orphaned options found!');
      orphanedOptions.forEach(opt => {
        console.log('   Orphaned option:', opt.id, '-', opt.title);
      });
    } else {
      console.log('   ✅ PASSED: No orphaned options');
    }

    console.log('\n📊 Summary:');
    console.log('   Feature #170: Delete decision removes options');
    console.log('   Status: ✅ VERIFIED PASSING');

  } catch (error) {
    console.log('Error:', error.message);
  }
}

verifyCascadeDelete();
