const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUserEmail() {
  const userId = '1bcace3d-315a-4c2f-8751-e950fb21ff14';
  const decisionId = 'a4e8143c-116d-4644-8072-318dd6addd0f';

  const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) {
    console.error('Error getting user:', userError.message);
    return;
  }

  console.log('User email:', user.user.email);
  console.log('Decision ID:', decisionId);
  console.log('Edit URL:', `http://localhost:5173/decisions/${decisionId}/edit`);
}

getUserEmail().then(() => process.exit(0));
