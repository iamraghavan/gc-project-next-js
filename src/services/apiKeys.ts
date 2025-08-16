
'use server'

import {
  Timestamp,
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from "firebase/functions";
import { type User } from 'firebase/auth'

export interface ApiKey {
  id: string;
  key: string;
  userId: string;
  createdAt: Timestamp;
}

const functions = getFunctions();

const callApiKeyFunction = async (action: string, params?: any) => {
    try {
        const func = httpsCallable(functions, action);
        const result = await func(params);
        return result.data;
    } catch (error: any) {
        console.error(`Error calling ${action} function:`, error.message);
        throw new Error(error.message || `Failed to execute ${action}.`);
    }
}

// Create a new API key for the current user
export async function generateApiKey(): Promise<{ success: boolean }> {
  return callApiKeyFunction('generateApiKey');
}

// Get all API keys for the current user
export async function getApiKeys(): Promise<ApiKey[]> {
    const data = await callApiKeyFunction('getApiKeys') as any;
    // Timestamps from callable functions are returned as objects, so we need to convert them
    return data.keys.map((key: any) => ({
        ...key,
        createdAt: new Timestamp(key.createdAt._seconds, key.createdAt._nanoseconds)
    }));
}

// Revoke (delete) an API key
export async function revokeApiKey(keyId: string): Promise<{ success: boolean }> {
    return callApiKeyFunction('revokeApiKey', { keyId });
}


// This server-side function is for the API endpoint to use, not the client app
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Validate an API key and get the associated user info
export async function validateApiKey(key: string): Promise<{ isValid: boolean, user: User | null }> {
  if (!authAdmin || !dbAdmin) {
    console.error("Firebase Admin SDK not initialized. Cannot validate API key.");
    return { isValid: false, user: null };
  }
  try {
    const q = query(collection(dbAdmin, 'apiKeys'), where('key', '==', key))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { isValid: false, user: null }
    }

    const apiKeyDoc = querySnapshot.docs[0];
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


    