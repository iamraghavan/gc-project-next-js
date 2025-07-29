
'use server';

import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import type { User } from 'firebase/auth';

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

export async function logActivity(action: string, details: LogEntry['details'], apiUser?: ApiUser) {
    try {
        let user: ApiUser;

        if (apiUser) {
            user = apiUser;
        } else {
            const currentUser = auth.currentUser;
            user = {
                name: currentUser?.displayName || "Anonymous",
                email: currentUser?.email || "N/A",
                avatar: currentUser?.photoURL || null,
            };
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
