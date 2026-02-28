// src/lib/errorHandler.js
// Centralized error handling: logs detailed errors for debugging, shows generic messages to users

/**
 * Handles errors consistently across the app
 * - Logs full error details to console for debugging
 * - Returns a generic user-friendly message
 * 
 * @param {Error|string} error - The error object or message
 * @param {string} context - Context for logging (e.g., 'API Call', 'Firestore', 'Auth')
 * @returns {string} Generic user-friendly error message
 */
export function handleError(error, context = 'Operation') {
  // Log full error details to console for debugging
  console.error(`[${context}] Error:`, error)
  
  if (error instanceof Error) {
    console.error(`[${context}] Stack:`, error.stack)
  }
  
  // Return generic message to user
  return 'Something went wrong. Please try again.'
}

/**
 * Wrapper for async API calls with error handling
 * @param {Function} apiCall - Async function that makes the API call
 * @param {string} context - Context for logging
 * @returns {Promise<any>} Result from apiCall or throws with generic message
 */
export async function withErrorHandler(apiCall, context = 'API Call') {
  try {
    return await apiCall()
  } catch (error) {
    const userMessage = handleError(error, context)
    throw new Error(userMessage)
  }
}
