// Utility functions for handling API errors consistently

export function getErrorMessage(error) {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.message || `Server error (${error.response.status})`;
  } else if (error.request) {
    // Network error
    return "Network error. Please check your connection and try again.";
  } else {
    // Other error
    return error.message || "An unexpected error occurred";
  }
}

export function isAuthError(error) {
  return error?.response?.status === 401 || 
         error?.message?.toLowerCase().includes('token') ||
         error?.message?.toLowerCase().includes('unauthorized');
}

export function isNetworkError(error) {
  return !error.response && error.request;
}

export function isServerError(error) {
  return error?.response?.status >= 500;
}

export function shouldRetry(error, retryCount = 0, maxRetries = 3) {
  if (retryCount >= maxRetries) return false;
  
  // Retry on network errors or server errors
  return isNetworkError(error) || isServerError(error);
}

export function getRetryDelay(retryCount) {
  // Exponential backoff: 1s, 2s, 4s, 8s...
  return Math.pow(2, retryCount) * 1000;
}

export class ApiError extends Error {
  constructor(message, status, originalError) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.originalError = originalError;
  }
}

export function createApiError(error) {
  const message = getErrorMessage(error);
  const status = error.response?.status;
  return new ApiError(message, status, error);
}