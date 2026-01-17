import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  try {
    console.log('Creating test user: session21test@example.com');

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'session21test@example.com',
      password: 'testpass123',
      email_confirm: true,
    });

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('User created successfully!');
    console.log('Email: session21test@example.com');
    console.log('Password: testpass123');
    console.log('User ID:', data.user.id);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createUser();
