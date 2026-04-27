// src/lib/errorHandler.js
// Centralized error handling: logs detailed errors for debugging, shows generic messages to users

/**
 * Sends error details to admin account via API
 * @param {Error|string} error - The error object or message
 * @param {string} context - Context for logging (e.g., 'API Call', 'Firestore', 'Auth')
 * @param {Object} additionalData - Extra data to attach to the error log
 */
async function logErrorToAdmin(error, context, additionalData = {}) {
  try {
    // Get current user info if available
    let userId = 'unknown';
    let userEmail = 'unknown';
    
    try {
      const auth = (await import('firebase/auth')).getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        userId = currentUser.uid;
        userEmail = currentUser.email || 'unknown';
      }
    } catch (e) {
      // Auth not available yet, continue without user info
    }

    const errorData = {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      context,
      userId,
      userEmail,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString(),
      additionalData,
    };

    // Send to admin error logging endpoint
    const response = await fetch('/api/errorLog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Error logged to admin:', result.errorLogId);
    } else {
      console.warn('⚠️ Failed to log error to admin');
    }
  } catch (err) {
    // Silently fail if error logging fails - don't break the app
    console.warn('Error logging system failed:', err);
  }
}

/**
 * Handles errors consistently across the app
 * - Logs full error details to console for debugging
 * - Sends detailed error to admin account
 * - Returns a generic user-friendly message
 * 
 * @param {Error|string} error - The error object or message
 * @param {string} context - Context for logging (e.g., 'API Call', 'Firestore', 'Auth')
 * @param {Object} additionalData - Extra data to attach to the error log
 * @returns {string} Generic user-friendly error message
 */
export function handleError(error, context = 'Operation', additionalData = {}) {
  // Log full error details to console for debugging
  console.error(`[${context}] Error:`, error)
  
  if (error instanceof Error) {
    console.error(`[${context}] Stack:`, error.stack)
  }
  
  // Send error to admin account (non-blocking)
  logErrorToAdmin(error, context, additionalData);
  
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
