"use client"

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

const logs = [
  {
    user: { name: "John Doe", avatar: "https://placehold.co/40x40.png" },
    action: "upload",
    file: "logo-design.png",
    timestamp: "2024-05-21 10:00 AM",
  },
  {
    user: { name: "Jane Smith", avatar: "https://placehold.co/40x40.png" },
    action: "delete",
    file: "old-logo.svg",
    timestamp: "2024-05-21 09:45 AM",
  },
  {
    user: { name: "John Doe", avatar: "https://placehold.co/40x40.png" },
    action: "share",
    file: "roadmap.pdf",
    timestamp: "2024-05-20 03:20 PM",
  },
  {
    user: { name: "Alice", avatar: "https://placehold.co/40x40.png" },
    action: "modify",
    file: "README.md",
    timestamp: "2024-05-20 11:10 AM",
  },
  {
    user: { name: "Bob", avatar: "https://placehold.co/40x40.png" },
    action: "access",
    file: "website-backup.zip",
    timestamp: "2024-05-19 08:00 AM",
  },
    {
    user: { name: "Charlie", avatar: "https://placehold.co/40x40.png" },
    action: "upload",
    file: "landing-page.jpg",
    timestamp: "2024-05-18 05:30 PM",
  },
];

const actionColors: { [key: string]: "default" | "destructive" | "secondary" } = {
    upload: "default",
    delete: "destructive",
    share: "secondary",
    modify: "secondary",
    access: "secondary",
}


export default function LogsPage() {
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
                    <TableHead>File / Item</TableHead>
                    <TableHead>Timestamp</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {logs.map((log, index) => (
                    <TableRow key={index}>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={log.user.avatar} data-ai-hint="person avatar" />
                            <AvatarFallback>{log.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{log.user.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={actionColors[log.action]}>{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.file}</TableCell>
                    <TableCell>{log.timestamp}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
