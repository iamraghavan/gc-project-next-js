
'use server'

import {
  Timestamp,
} from 'firebase/firestore'
import { type User } from 'firebase/auth'

export interface ApiKey {
  id: string;
  key: string;
  userId: string;
  createdAt: Timestamp;
}

// This server-side function is for the public file upload API endpoint to use, not the client app
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';

export interface ApiUser {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
}

// Validate an API key and get the associated user info
export async function validateApiKey(key: string): Promise<{ isValid: boolean, user: ApiUser | null }> {
  if (!authAdmin || !dbAdmin) {
    console.error("Firebase Admin SDK not initialized. Cannot validate API key.");
    return { isValid: false, user: null };
  }
  try {
    const apiKeysRef = dbAdmin.collection('apiKeys');
    const snapshot = await apiKeysRef.where('key', '==', key).limit(1).get();

    if (snapshot.empty) {
      return { isValid: false, user: null }
    }

    const apiKeyDoc = snapshot.docs[0];
    const apiKeyData = apiKeyDoc.data() as ApiKey;
    
    const userRecord = await authAdmin.getUser(apiKeyData.userId);

     const user: ApiUser = {
      uid: userRecord.uid,
      displayName: userRecord.displayName || `API User`,
      email: userRecord.email || 'N/A',
      photoURL: userRecord.photoURL || null,
    };


    return { isValid: true, user: user as any }
  } catch (error) {
    console.error("Error validating API key:", error)
    return { isValid: false, user: null }
  }
}
