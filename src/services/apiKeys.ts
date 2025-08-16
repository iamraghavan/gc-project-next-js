
'use server'

import {
  Timestamp,
} from 'firebase/firestore'
import { auth } from '@/lib/firebase';

export interface ApiKey {
  id: string;
  key: string;
  userId: string;
  createdAt: Timestamp;
}

// This helper function will run on the client, get the token, and call the API route.
async function callKeyApi(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("You must be logged in to manage API keys.");
    }
    const token = await user.getIdToken();

    const response = await fetch(endpoint, {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `Failed to call ${endpoint}`);
    }
    
    return result;
}


// Create a new API key for the current user
export async function generateApiKey(): Promise<{ success: boolean }> {
  return callKeyApi('/api/keys/generate', 'POST');
}

// Get all API keys for the current user
export async function getApiKeys(): Promise<ApiKey[]> {
    const data = await callKeyApi('/api/keys/get') as any;
    // Timestamps from API routes are serialized as strings, so we need to convert them
    return data.keys.map((key: any) => ({
        ...key,
        createdAt: new Timestamp(key.createdAt._seconds, key.createdAt._nanoseconds)
    }));
}

// Revoke (delete) an API key
export async function revokeApiKey(keyId: string): Promise<{ success: boolean }> {
    return callKeyApi('/api/keys/revoke', 'POST', { keyId });
}


// This server-side function is for the public file upload API endpoint to use, not the client app
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';
import { type User } from 'firebase/auth'

// Validate an API key and get the associated user info
export async function validateApiKey(key: string): Promise<{ isValid: boolean, user: User | null }> {
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

     const user: User = {
      uid: userRecord.uid,
      displayName: userRecord.displayName || `API User`,
      email: userRecord.email || 'N/A',
      photoURL: userRecord.photoURL || null,
      providerId: 'api',
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => '',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
    };


    return { isValid: true, user }
  } catch (error) {
    console.error("Error validating API key:", error)
    return { isValid: false, user: null }
  }
}
