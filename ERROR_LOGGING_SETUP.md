# Error Logging for Admin Account

## Setup Instructions

This system logs all application errors to a specific admin account so you can see the exact issues occurring in the system.

### 1. Environment Variables

Add these to your `.env` file or Vercel environment variables:

```
ADMIN_ERROR_EMAIL=your-admin-email@example.com
```

The `ADMIN_ERROR_EMAIL` is the account that will receive all error information. You should set this to an admin's email address.

### 2. Firestore Security Rules

Update your `firestore.rules` to restrict access to error logs:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Error logs - only admins can read
    match /artifacts/language-hub-v2/errorLogs/{document=**} {
      allow create: if request.auth != null;  // Any authenticated user can report errors
      allow read, update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/artifacts/language-hub-v2/users/$(request.auth.uid)/roles/admin).data.level == 'admin';
    }
  }
}
```

### 3. How It Works

1. **Error Occurs**: When an error happens anywhere in the app, `handleError()` is called
2. **Logged Locally**: Error is logged to browser console for debugging
3. **Sent to API**: Error details are sent to `/api/errorLog` endpoint via POST request
4. **Stored in Firestore**: The error is stored in `artifacts/language-hub-v2/errorLogs` collection
5. **Admin Notified**: The error details include:
   - Error message & stack trace
   - Context (which part of app failed)
   - User email & ID
   - Current URL
   - Timestamp
   - Any additional data passed to the handler

### 4. Accessing Error Logs

#### Option A: Error Logs Viewer Dashboard
Import and add the component to your admin dashboard:

```jsx
import ErrorLogsViewer from './modules/admin/ErrorLogsViewer'

// In your admin dashboard:
<ErrorLogsViewer userId={currentUserId} />
```

#### Option B: Firestore Console
View directly in Firebase Console:
1. Go to Firestore Database
2. Navigate to: `artifacts` → `language-hub-v2` → `errorLogs`
3. See all logged errors with full details

#### Option C: Query via API
You can create additional admin endpoints to retrieve and analyze errors

### 5. Using the Error Handler

The `handleError()` function now supports optional additional data:

```javascript
import { handleError } from './lib/errorHandler'

try {
  // your code
} catch (error) {
  // Basic usage (no additional data)
  handleError(error, 'Context Name')
  
  // With additional data
  handleError(error, 'API Call', {
    endpoint: '/api/checkout',
    method: 'POST',
    requestData: { /* ... */ }
  })
}
```

### 6. Testing

To test the error logging system:

```javascript
import { handleError } from './lib/errorHandler'

// This will log an error that the admin can see
handleError(
  new Error('Test error from development'),
  'Development Test',
  { testMode: true }
)
```

Then check Firestore to confirm the error appears in the errorLogs collection.

## Error Log Data Structure

Each error log contains:

```javascript
{
  errorMessage: string,      // The error message
  errorStack: string,        // Full stack trace
  context: string,           // Where error occurred (e.g., "API Call")
  userId: string,            // User ID (from Firebase Auth)
  userEmail: string,         // User email (from Firebase Auth)
  url: string,               // Browser URL where error occurred
  timestamp: string,         // ISO timestamp
  additionalData: object,    // Custom data passed to handleError()
  createdAt: timestamp,      // Server timestamp
  sentToAdmin: boolean,      // Whether admin was notified
}
```

## Troubleshooting

**Errors not appearing?**
- Check that `/api/errorLog` endpoint is deployed
- Verify `ADMIN_ERROR_EMAIL` environment variable is set
- Check browser console for network errors when trying to log
- Ensure Firestore is accessible and not hitting quota limits

**Can't see error logs in admin panel?**
- Confirm your Firestore rules allow admin read access
- Verify your account has admin role in the system
- Check that errors are actually being triggered

**Performance concerns?**
- Error logging is non-blocking (uses async without awaiting)
- If app fails to log errors, it won't break the application
- Large error logs collection won't affect app performance
