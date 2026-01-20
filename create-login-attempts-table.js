require('dotenv').config({ path: '.env' });

async function createTable() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/login_attempts`;
  const headers = {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  // Try to create a test record (this will fail if table doesn't exist)
  const testResponse = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: 'test@example.com',
      success: false
    })
  });

  if (testResponse.ok) {
    console.log('✓ Table exists');
    // Delete the test record
    await fetch(`${url}?email=eq.test@example.com`, {
      method: 'DELETE',
      headers
    });
    return;
  }

  const error = await testResponse.json();
  console.log('Table does not exist, error:', error);
  console.log('\nPlease run this SQL in Supabase Dashboard > SQL Editor:\n');

  console.log(`
-- Create login_attempts table for tracking failed login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT false
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address, attempted_at DESC);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy: Service role can do anything
CREATE POLICY "Service role has full access to login_attempts"
  ON public.login_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy: No access for anon/authenticated users (security)
CREATE POLICY "No direct access to login_attempts"
  ON public.login_attempts
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
  `);
}

createTable();
