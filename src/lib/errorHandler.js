// src/lib/errorHandler.js
// Centralized error handling: logs errors to admin and shows to user

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
 * Handles errors: logs to console, sends to admin, and throws the error
 * @param {Error|string} error - The error object or message
 * @param {string} context - Context for logging (e.g., 'API Call', 'Firestore', 'Auth')
 * @param {Object} additionalData - Extra data to attach to the error log
 * @throws Rethrows the error after logging
 */
export function handleError(error, context = 'Operation', additionalData = {}) {
  // Log full error details to console for debugging
  console.error(`[${context}] Error:`, error)
  
  if (error instanceof Error) {
    console.error(`[${context}] Stack:`, error.stack)
  }
  
  // Send error to admin account (non-blocking)
  logErrorToAdmin(error, context, additionalData);
  
  // Rethrow the error so the caller can handle it
  throw error;
}
