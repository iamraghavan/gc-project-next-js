import * as admin from 'firebase-admin';
import 'dotenv/config';

const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Check if the required environment variables are present before initializing.
if (!admin.apps.length && serviceAccount.project_id && serviceAccount.private_key) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
      databaseURL: `https://{serviceAccount.project_id}.firebaseio.com`
    });
  } catch (error: any) {
     console.error("Firebase Admin initialization error:", error.message);
  }
}

const authAdmin = admin.apps.length ? admin.auth() : null;
const dbAdmin = admin.apps.length ? admin.firestore() : null;

export { authAdmin, dbAdmin };
