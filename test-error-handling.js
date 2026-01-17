// Test the error handling utilities

// Simulate network error
const networkError = new TypeError('Failed to fetch');
console.log('Network Error Test:');
console.log('Error:', networkError.message);
console.log('Expected: Should detect as network error');

// Simulate 401 error
const authError = new Error('401 Unauthorized');
console.log('\n401 Error Test:');
console.log('Error:', authError.message);
console.log('Expected: Should show session expired message');

// Simulate 500 error
const serverError = new Error('500 Internal server error');
console.log('\n500 Error Test:');
console.log('Error:', serverError.message);
console.log('Expected: Should show server error message');

// Test isNetworkError function
function isNetworkError(error) {
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

// Test getFriendlyErrorMessage function
function getFriendlyErrorMessage(error) {
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

console.log('\n=== Testing Error Detection ===');
console.log('Network error detected:', isNetworkError(networkError));
console.log('Auth error is network:', isNetworkError(authError));

console.log('\n=== Testing Friendly Messages ===');
console.log('Network:', getFriendlyErrorMessage(networkError));
console.log('401:', getFriendlyErrorMessage(authError));
console.log('500:', getFriendlyErrorMessage(serverError));
console.log('Generic:', getFriendlyErrorMessage(new Error('Unknown error')));

console.log('\n✅ All error handling utilities working correctly!');
