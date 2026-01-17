/**
 * Utility functions for error handling and user-friendly error messages
 */

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('connection')
    );
  }
  return false;
}

/**
 * Get a user-friendly error message from an error object
 */
export function getFriendlyErrorMessage(error: unknown): string {
  // Network errors
  if (isNetworkError(error)) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  // HTTP errors
  if (error instanceof Error) {
    const message = error.message;

    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Your session has expired. Please log in again.';
    }

    if (message.includes('403') || message.includes('Forbidden')) {
      return 'You don\'t have permission to access this resource.';
    }

    if (message.includes('404') || message.includes('Not found')) {
      return 'The requested resource was not found.';
    }

    if (message.includes('500') || message.includes('Internal server')) {
      return 'Something went wrong on our end. Please try again later.';
    }
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Show a user-friendly error alert
 */
export function showErrorAlert(error: unknown, context?: string): void {
  const friendlyMessage = getFriendlyErrorMessage(error);
  const fullMessage = context
    ? `${context}: ${friendlyMessage}`
    : friendlyMessage;

  alert(fullMessage);
}
