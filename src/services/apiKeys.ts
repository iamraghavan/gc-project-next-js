
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

export interface ApiKey {
  id: string;
  key: string;
  userId: string;
  createdAt: Timestamp;
}

// Generates a secure random API key
function generateSecureApiKey(): string {
  return randomBytes(24).toString('hex')
}

// Create a new API key for the current user
export async function generateApiKey(): Promise<ApiKey> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('You must be logged in to generate an API key.')
  }

  const apiKey = generateSecureApiKey()
  const apiKeyData = {
    key: apiKey,
    userId: currentUser.uid,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, 'apiKeys'), apiKeyData)
  return { id: docRef.id, ...apiKeyData, createdAt: new Timestamp(new Date().getTime() / 1000, 0) } as ApiKey
}

// Get all API keys for the current user
export async function getApiKeys(): Promise<ApiKey[]> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    return []
  }

  const q = query(
    collection(db, 'apiKeys'),
    where('userId', '==', currentUser.uid)
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
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("Authentication required.");
    }
    
    const keyDocRef = doc(db, 'apiKeys', keyId);
    // You might want to add a check here to ensure the user owns the key they're trying to delete
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

    // This is a placeholder for fetching user details.
    // In a real app, you would fetch the user from Firebase Auth by UID.
    // For this prototype, we'll construct a mock user object.
     const user: User = {
      uid: apiKeyData.userId,
      // The following are mock values as we can't easily get them server-side without the Admin SDK
      displayName: `API User ${apiKeyData.userId.substring(0,5)}`,
      email: `api-user-${apiKeyData.userId.substring(0,5)}@gitdrive.com`,
      photoURL: null,
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
