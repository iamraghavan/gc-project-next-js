
'use server'

import { db } from '@/lib/firebase'
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
  getDoc,
} from 'firebase/firestore'
import { randomBytes } from 'crypto'
import { type User } from 'firebase/auth'
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

// This is the single, reliable source for getting the user's UID from an ID token.
async function getUserUidFromToken(idToken: string): Promise<string> {
    if (!authAdmin) {
        throw new Error("Authentication service is not available. Please configure server-side environment variables.");
    }
    if (!idToken) {
        throw new Error("Authentication token is missing.");
    }

    try {
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        throw new Error("Invalid or expired authentication token.");
    }
}

// Create a new API key for the current user
export async function generateApiKey(idToken: string): Promise<ApiKey> {
  const userId = await getUserUidFromToken(idToken);
  
  const apiKey = generateSecureApiKey()
  const apiKeyData = {
    key: apiKey,
    userId: userId,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, 'apiKeys'), apiKeyData)
  return { id: docRef.id, ...apiKeyData, createdAt: new Timestamp(new Date().getTime() / 1000, 0) } as ApiKey
}

// Get all API keys for the current user
export async function getApiKeys(idToken: string): Promise<ApiKey[]> {
    const userId = await getUserUidFromToken(idToken);

    const q = query(
      collection(db, 'apiKeys'),
      where('userId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    const keys: ApiKey[] = []
    querySnapshot.forEach((doc) => {
      keys.push({ id: doc.id, ...doc.data() } as ApiKey)
    })
    return keys
}

// Revoke (delete) an API key
export async function revokeApiKey(idToken: string, keyId: string): Promise<void> {
    const userId = await getUserUidFromToken(idToken);
    
    const keyDocRef = doc(db, 'apiKeys', keyId);
    const keyDocSnapshot = await getDoc(keyDocRef);

    if (!keyDocSnapshot.exists() || keyDocSnapshot.data().userId !== userId) {
        throw new Error("API key not found or you don't have permission to revoke it.");
    }

    await deleteDoc(keyDocRef);
}


// Validate an API key and get the associated user info
export async function validateApiKey(key: string): Promise<{ isValid: boolean, user: User | null }> {
  if (!authAdmin) {
    console.error("Firebase Admin SDK not initialized. Cannot validate API key.");
    return { isValid: false, user: null };
  }
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
