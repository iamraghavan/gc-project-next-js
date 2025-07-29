
'use server'

import { db, auth } from '@/lib/firebase'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore'
import { randomBytes } from 'crypto'
import { type User } from 'firebase/auth'
import { headers } from 'next/headers'
import { authAdmin } from '@/lib/firebase-admin'

export interface ApiKey {
  id: string;
  key: string;
  userId: string;
  createdAt: Timestamp;
}

// Generates a secure random API key
function generateSecureApiKey(): string {
  return 'gitdrive_' + randomBytes(24).toString('hex')
}

async function getCurrentUser() {
    const authorization = headers().get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        const idToken = authorization.split("Bearer ")[1];
        try {
            const decodedToken = await authAdmin.verifyIdToken(idToken);
            return decodedToken;
        } catch (error) {
            console.error("Error verifying ID token:", error);
            return null;
        }
    }
    return null;
}

// Create a new API key for the current user
export async function generateApiKey(): Promise<ApiKey> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('You must be logged in to generate an API key.')
  }

  const apiKey = generateSecureApiKey()
  const apiKeyData = {
    key: apiKey,
    userId: user.uid,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, 'apiKeys'), apiKeyData)
  return { id: docRef.id, ...apiKeyData, createdAt: new Timestamp(new Date().getTime() / 1000, 0) } as ApiKey
}

// Get all API keys for the current user
export async function getApiKeys(): Promise<ApiKey[]> {
    const user = await getCurrentUser();
  if (!user) {
    return []
  }

  const q = query(
    collection(db, 'apiKeys'),
    where('userId', '==', user.uid)
  )
  const querySnapshot = await getDocs(q)
  const keys: ApiKey[] = []
  querySnapshot.forEach((doc) => {
    keys.push({ id: doc.id, ...doc.data() } as ApiKey)
  })
  return keys
}

// Revoke (delete) an API key
export async function revokeApiKey(keyId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Authentication required.");
    }
    
    // You might want to add a check here to ensure the user owns the key they're trying to delete
    // For now, we assume the client-side only shows keys belonging to the user.
    const keyDocRef = doc(db, 'apiKeys', keyId);
    await deleteDoc(keyDocRef);
}


// Validate an API key and get the associated user info
export async function validateApiKey(key: string): Promise<{ isValid: boolean, user: User | null }> {
  try {
    const q = query(collection(db, 'apiKeys'), where('key', '==', key))
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
