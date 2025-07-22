'use server';

import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import type { User } from 'firebase/auth';

export interface LogEntry {
    id?: string;
    user: {
        name: string | null;
        email: string | null;
        avatar: string | null;
    };
    action: string;
    details: {
        repoFullName: string;
        path: string;
        [key: string]: any;
    };
    timestamp: Date;
}

export async function logActivity(action: string, details: LogEntry['details']) {
    try {
        const user = auth.currentUser;

        const logData = {
            user: {
                name: user?.displayName || "Anonymous",
                email: user?.email || "N/A",
                avatar: user?.photoURL || null,
            },
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
