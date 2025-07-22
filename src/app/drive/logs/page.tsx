"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { getLogs, type LogEntry } from "@/services/logging"
import { formatDistanceToNow } from "date-fns"


const actionColors: { [key: string]: "default" | "destructive" | "secondary" } = {
    upload: "default",
    create_folder: "default",
    create_repo: "default",
    set_expiration: "secondary",
    delete: "destructive",
    share: "secondary",
    modify: "secondary",
    access: "secondary",
}


export default function LogsPage() {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    getLogs()
      .then(setLogs)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Access Logs</h2>
      <Card>
        <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>A log of all user and file activities in the selected repository.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Repository</TableHead>
                    <TableHead>Timestamp</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      </TableRow>
                    ))
                )}
                {!isLoading && logs.map((log) => (
                    <TableRow key={log.id}>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={log.user.avatar || undefined} data-ai-hint="person avatar" />
                            <AvatarFallback>{log.user.name?.charAt(0) || 'A'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium">{log.user.name}</span>
                            <span className="text-xs text-muted-foreground">{log.user.email}</span>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={actionColors[log.action] || 'secondary'}>{log.action.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.details.path}</TableCell>
                    <TableCell>{log.details.repoFullName}</TableCell>
                    <TableCell>{formatDistanceToNow(log.timestamp, { addSuffix: true })}</TableCell>
                    </TableRow>
                ))}
                 {!isLoading && logs.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No activity logs found.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
