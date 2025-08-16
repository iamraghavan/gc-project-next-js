
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, getDoc } from "firebase/firestore";
import { headers } from 'next/headers'
import { authAdmin } from '@/lib/firebase-admin';


// This allows us to log actions from an API user who isn't the currently signed-in Firebase user
export interface ApiUser {
    name: string | null;
    email: string | null;
    avatar: string | null;
    uid?: string;
}

export interface LogEntry {
    id?: string;
    user: ApiUser;
    action: string;
    details: {
        repoFullName: string;
        path: string;
        [key: string]: any;
    };
    timestamp: Date;
}

async function getCurrentUser(): Promise<ApiUser | null> {
    if (!authAdmin) return null;

    // This is the intended way to get the token in a server action context
    const authorization = headers().get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
        return { name: "Anonymous Web User", email: "N/A", avatar: null };
    }

    const idToken = authorization.split("Bearer ")[1];
    try {
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const userRecord = await authAdmin.getUser(decodedToken.uid);
        return {
            name: userRecord.displayName || "Anonymous",
            email: userRecord.email || "N/A",
            avatar: userRecord.photoURL || null,
        };
    } catch (error) {
        console.error("Error verifying ID token for logging:", error);
        // Don't throw, just log as a system user if token is invalid
        return { name: "System (Invalid Token)", email: "N/A", avatar: null };
    }
}

export async function logActivity(action: string, details: LogEntry['details'], apiUser?: ApiUser) {
    try {
        let user: ApiUser | null = null;

        if (apiUser) {
            // If an API user is explicitly passed (e.g., from an API key), use that.
            user = apiUser;
        } else {
            // Otherwise, determine the user from the session token.
            user = await getCurrentUser();
        }

        if (!user) {
            user = { name: "System (Unknown)", email: "N/A", avatar: null };
        }


        const logData = {
            user,
            action,
            details,
            timestamp: serverTimestamp(),
        };
        await addDoc(collection(db, "logs"), logData);
    } catch (error) {
        console.error("Error logging activity:", error);
        // We probably don't want to throw an error here and interrupt user flow
    }
}

export async function getLogs(): Promise<LogEntry[]> {
    try {
        const logsCollection = collection(db, "logs");
        const q = query(logsCollection, orderBy("timestamp", "desc"));
        const logSnapshot = await getDocs(q);
        
        const logs: LogEntry[] = [];
        logSnapshot.forEach(doc => {
            const data = doc.data();
            logs.push({
                id: doc.id,
                user: data.user,
                action: data.action,
                details: data.details,
                timestamp: data.timestamp.toDate(),
            });
        });

        return logs;

    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
}
