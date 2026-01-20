const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkSchemas() {
  console.log('Checking database schemas...\n');

  // Check profiles table
  console.log('PROFILES table:');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    if (profiles && profiles.length > 0) {
      console.log('Columns:', Object.keys(profiles[0]));
    } else if (error) {
      console.log('Error:', error.message);
    }
  } catch (e) {
    console.log('No access or error');
  }

  // Check categories table
  console.log('\nCATEGORIES table:');
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    if (categories && categories.length > 0) {
      console.log('Columns:', Object.keys(categories[0]));
    } else if (error) {
      console.log('Error:', error.message);
    }
  } catch (e) {
    console.log('No access or error');
  }

  // Check decisions table
  console.log('\nDECISIONS table:');
  try {
    const { data: decisions, error } = await supabase
      .from('decisions')
      .select('*')
      .limit(1);
    if (decisions && decisions.length > 0) {
      console.log('Columns:', Object.keys(decisions[0]));
    } else if (error) {
      console.log('Error:', error.message);
    }
  } catch (e) {
    console.log('No access or error');
  }
}

checkSchemas();
