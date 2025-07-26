'use server'

import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LogEntry } from './logging'

export interface DashboardStats {
  activeUsers: number
  fileActivities24h: number
  monthlyUploads: { month: string; uploads: number }[]
  userActivity: { month: string; actions: number }[]
}

export async function getDashboardStats(repoFullName: string | null): Promise<DashboardStats> {
  try {
    const logsCollection = collection(db, 'logs')
    
    // Base query for the selected repository
    const baseQuery = repoFullName 
      ? query(logsCollection, where('details.repoFullName', '==', repoFullName))
      : logsCollection;

    // Fetch all relevant logs once
    const logSnapshot = await getDocs(baseQuery);
    const logs: LogEntry[] = [];
    logSnapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toDate(),
        } as LogEntry);
    });

    // 1. Active Users (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsersSet = new Set<string>()
    logs.forEach(log => {
      if (log.timestamp >= thirtyDaysAgo && log.user.email) {
        activeUsersSet.add(log.user.email)
      }
    })

    // 2. File Activities (last 24 hours)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
    const fileActionTypes = ['upload', 'delete', 'move', 'create_folder']
    const fileActivities24h = logs.filter(
      log => log.timestamp >= twentyFourHoursAgo && fileActionTypes.includes(log.action)
    ).length

    // 3. & 4. Monthly data for charts (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthlyUploads: { [key: string]: number } = {}
    const userActivity: { [key: string]: number } = {}

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyUploads[monthKey] = 0;
      userActivity[monthKey] = 0;
    }
    
    logs.forEach(log => {
        if (log.timestamp >= sixMonthsAgo) {
            const monthKey = `${monthNames[log.timestamp.getMonth()]} ${log.timestamp.getFullYear()}`;
            if (userActivity[monthKey] !== undefined) {
                 userActivity[monthKey]++;
            }
            if (log.action === 'upload' && monthlyUploads[monthKey] !== undefined) {
                monthlyUploads[monthKey]++;
            }
        }
    })

    const formatChartData = (data: { [key: string]: number }) => {
       return Object.entries(data).map(([month, value]) => ({
            month: month.split(' ')[0].substring(0, 3), // "Jan", "Feb", etc.
            value: value,
       })).slice(-6); // Ensure only last 6 months are returned
    }
    
    return {
      activeUsers: activeUsersSet.size,
      fileActivities24h,
      monthlyUploads: formatChartData(monthlyUploads).map(d => ({ month: d.month, uploads: d.value })),
      userActivity: formatChartData(userActivity).map(d => ({ month: d.month, actions: d.value })),
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return empty/default stats on error
    return {
      activeUsers: 0,
      fileActivities24h: 0,
      monthlyUploads: [],
      userActivity: [],
    }
  }
}
