const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

const supabaseUrl = envLines.find(l => l.startsWith('SUPABASE_URL='))?.split('=')[1];
const supabaseKey = envLines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='))?.split('=')[1];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestData() {
  const email = 'test_f280_pdf_export@example.com';
  const password = 'Test1234!';

  console.log('Creating test data for Feature #280: PDF Export Verification');

  try {
    // Use Supabase Admin API to list users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    const existingUser = users.find(u => u.email === email);
    let userId;

    if (existingUser) {
      console.log('User already exists:', email);
      userId = existingUser.id;
    } else {
      // Create user via Supabase Auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating user:', createError);
        process.exit(1);
      }

      userId = newUser.user.id;
      console.log('Created user:', email);
    }

    // Create or get category
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Testing')
      .single();

    let categoryId;
    if (category) {
      categoryId = category.id;
      console.log('Category already exists: Testing');
    } else {
      const { data: newCategory, error: catError } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: 'Testing',
          slug: 'testing',
          color: '#FF6B6B',
        })
        .select()
        .single();

      if (catError) {
        console.error('Error creating category:', catError);
        process.exit(1);
      }
      categoryId = newCategory.id;
      console.log('Created category: Testing');
    }

    // Create test decisions
    const decisions = [
      {
        title: 'F280_TEST: Career Path Decision - A Long Title to Test Text Wrapping in PDF Export',
        status: 'decided',
        category_id: categoryId,
        decided_at: new Date().toISOString(),
      },
      {
        title: 'F280_TEST: Technology Stack Decision',
        status: 'in_progress',
        category_id: categoryId,
      },
      {
        title: 'F280_TEST: Office Location Decision',
        status: 'draft',
        category_id: categoryId,
      },
      {
        title: 'F280_TEST: Team Structure Decision',
        status: 'abandoned',
        category_id: categoryId,
        decided_at: new Date().toISOString(), // abandoned uses decided_at
      },
      {
        title: 'F280_TEST: Product Launch Decision - Final Decision Made For Testing PDF Export Feature',
        status: 'decided',
        category_id: categoryId,
        decided_at: new Date().toISOString(),
      },
    ];

    for (const decision of decisions) {
      // Check if decision exists
      const { data: existingDecision } = await supabase
        .from('decisions')
        .select('id')
        .eq('user_id', userId)
        .eq('title', decision.title)
        .single();

      if (!existingDecision) {
        const { error } = await supabase
          .from('decisions')
          .insert({
            user_id: userId,
            ...decision,
          });

        if (error) {
          console.error('Error creating decision:', error.message);
        } else {
          console.log('Created decision:', decision.title);
        }
      } else {
        console.log('Decision already exists:', decision.title);
      }
    }

    console.log('\n✅ Test data creation complete!');
    console.log('User:', email);
    console.log('Password:', password);
    console.log('Total decisions: 5');
    console.log('Categories: 1 (Testing)');
    console.log('Decision statuses: decided (2), in_progress (1), draft (1), abandoned (1)');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestData();
