// api/errorLog.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (Server-side)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Set this to the admin account email that should receive all error logs
const ADMIN_ERROR_EMAIL = process.env.ADMIN_ERROR_EMAIL || 'admin@example.com';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      errorMessage, 
      errorStack, 
      context, 
      userId, 
      userEmail,
      url,
      timestamp,
      additionalData
    } = req.body;

    // Validate required fields
    if (!errorMessage || !context) {
      return res.status(400).json({ 
        error: 'Missing required fields: errorMessage, context' 
      });
    }

    // Create error log entry
    const errorLogEntry = {
      errorMessage,
      errorStack: errorStack || 'No stack trace provided',
      context,
      userId: userId || 'unknown',
      userEmail: userEmail || 'unknown',
      url: url || 'unknown',
      timestamp: new Date(timestamp || Date.now()),
      additionalData: additionalData || {},
      createdAt: new Date(),
      sentToAdmin: false,
    };

    // Store error log in Firestore
    const errorLogsRef = db.collection('artifacts')
      .doc('language-hub-v2')
      .collection('errorLogs');

    const docRef = await errorLogsRef.add(errorLogEntry);

    console.log(`✅ Error logged with ID: ${docRef.id}`);
    console.log(`📧 Admin email configured: ${ADMIN_ERROR_EMAIL}`);

    // Mark as sent to admin
    await docRef.update({ sentToAdmin: true });

    // Return success response
    return res.status(200).json({ 
      success: true,
      errorLogId: docRef.id,
      message: `Error logged and will be reviewed by admin at ${ADMIN_ERROR_EMAIL}`
    });

  } catch (error) {
    console.error('Error logging failed:', error);
    
    return res.status(500).json({ 
      error: 'Failed to log error',
      details: error.message
    });
  }
}
