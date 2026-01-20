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

-- Comment
COMMENT ON TABLE public.login_attempts IS 'Tracks login attempts for rate limiting';
COMMENT ON COLUMN public.login_attempts.email IS 'Email address used for login attempt';
COMMENT ON COLUMN public.login_attempts.ip_address IS 'IP address of the client (optional)';
COMMENT ON COLUMN public.login_attempts.attempted_at IS 'Timestamp of the login attempt';
COMMENT ON COLUMN public.login_attempts.success IS 'Whether the login attempt was successful';
