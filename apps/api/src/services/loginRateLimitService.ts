import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// In-memory storage for login attempts (will persist to database when table exists)
const loginAttemptsCache = new Map<string, Array<{ timestamp: number; success: boolean }>>();

interface LoginAttempt {
  email: string;
  ipAddress?: string;
}

interface RateLimitCheck {
  allowed: boolean;
  remainingAttempts?: number;
  lockoutUntil?: Date;
}

interface LoginResult {
  success: boolean;
  error?: string;
  lockoutUntil?: Date;
  session?: any;
}

/**
 * Clean up old attempts from cache
 */
function cleanupOldAttempts(email: string) {
  const cutoff = Date.now() - LOCKOUT_MINUTES * 60 * 1000;
  const attempts = loginAttemptsCache.get(email) || [];
  const filtered = attempts.filter(a => a.timestamp > cutoff);
  loginAttemptsCache.set(email, filtered);
}

/**
 * Check if the email/IP is currently locked out due to too many failed attempts
 */
export async function checkRateLimit(email: string, _ipAddress?: string): Promise<RateLimitCheck> {
  // Clean up old attempts first
  cleanupOldAttempts(email);

  const attempts = loginAttemptsCache.get(email) || [];
  const failedAttempts = attempts.filter(a => !a.success).length;

  // Check if locked out
  if (failedAttempts >= MAX_ATTEMPTS) {
    const oldestFailedAttempt = attempts
      .filter(a => !a.success)
      .sort((a, b) => a.timestamp - b.timestamp)[0];

    if (oldestFailedAttempt) {
      const lockoutUntil = new Date(oldestFailedAttempt.timestamp + LOCKOUT_MINUTES * 60 * 1000);
      if (lockoutUntil > new Date()) {
        return {
          allowed: false,
          lockoutUntil,
          remainingAttempts: 0
        };
      }
    }
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - failedAttempts)
  };
}

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(attempt: LoginAttempt, success: boolean): Promise<void> {
  const key = attempt.email;
  const attempts = loginAttemptsCache.get(key) || [];

  attempts.push({
    timestamp: Date.now(),
    success
  });

  // Keep only recent attempts (within lockout window)
  const cutoff = Date.now() - LOCKOUT_MINUTES * 60 * 1000;
  const filtered = attempts.filter(a => a.timestamp > cutoff);

  loginAttemptsCache.set(key, filtered);

  // Try to persist to database if table exists (for long-term tracking)
  try {
    await supabase
      .from('login_attempts')
      .insert({
        email: attempt.email,
        ip_address: attempt.ipAddress,
        success: success
      });
  } catch (error: any) {
    // Table might not exist yet, that's fine - we're using cache
    if (!error.message?.includes('login_attempts')) {
      console.error('Error recording login attempt to database:', error);
    }
  }
}

/**
 * Login with rate limiting
 */
export async function loginWithRateLimit(
  email: string,
  password: string,
  ipAddress?: string
): Promise<LoginResult> {
  // First, check rate limits
  const rateLimitCheck = await checkRateLimit(email, ipAddress);

  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: `Too many failed login attempts. Account locked for ${LOCKOUT_MINUTES} minutes. Please try again later.`,
      lockoutUntil: rateLimitCheck.lockoutUntil
    };
  }

  // Attempt login with Supabase
  const supabaseAuth = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!);
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    // Record failed attempt
    await recordLoginAttempt({ email, ipAddress }, false);

    return {
      success: false,
      error: 'Invalid login credentials'
    };
  }

  // Record successful attempt
  await recordLoginAttempt({ email, ipAddress }, true);

  return {
    success: true,
    session: data.session
  };
}
