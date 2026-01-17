/**
 * Utility functions for authentication and session management
 */

import { supabase } from '../lib/supabase';

/**
 * Check if an HTTP response is a 401 Unauthorized error
 */
export function isUnauthorizedError(response: Response): boolean {
  return response.status === 401;
}

/**
 * Handle 401 errors by clearing session and redirecting to login
 * Returns true if the response was a 401 error
 */
export async function handleUnauthorizedError(response: Response): Promise<boolean> {
  if (isUnauthorizedError(response)) {
    // Clear the Supabase session
    await supabase.auth.signOut();

    // Show alert to user
    alert('Your session has expired. Please log in again.');

    // Redirect to login page with return URL
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?returnTo=${returnUrl}`;

    return true;
  }

  return false;
}

/**
 * Wrapper for fetch calls that automatically handles 401 errors
 */
export async function fetchWithAuthCheck(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, options);

  // Check for 401 and handle automatically
  await handleUnauthorizedError(response);

  return response;
}
