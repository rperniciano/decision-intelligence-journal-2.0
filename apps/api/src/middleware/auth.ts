import { FastifyRequest, FastifyReply } from 'fastify';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized Supabase admin client
// This ensures environment variables are read AFTER dotenv loads them
let supabaseAdmin: SupabaseClient | null = null;
let isSupabaseConfigured: boolean | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  // Initialize only once, but lazily after dotenv has loaded
  if (isSupabaseConfigured === null) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceKey);

    if (isSupabaseConfigured) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  return supabaseAdmin;
}

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
    };
  }
}

/**
 * Authentication middleware that verifies Supabase JWT tokens
 * Extracts the token from Authorization header and validates it
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Get authorization header
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Get the lazily-initialized Supabase admin client
  const adminClient = getSupabaseAdmin();

  // If Supabase is not configured, reject all requests
  if (!adminClient) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication service not configured',
    });
    return;
  }

  try {
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await adminClient.auth.getUser(token);

    if (error || !user) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Attach user to request for use in route handlers
    request.user = {
      id: user.id,
      email: user.email,
    };
  } catch (err) {
    console.error('Auth middleware error:', err);
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional auth middleware - doesn't reject if no token, but sets user if valid
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return;
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return;
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await adminClient.auth.getUser(token);

    if (!error && user) {
      request.user = {
        id: user.id,
        email: user.email,
      };
    }
  } catch {
    // Silently ignore errors for optional auth
  }
}
