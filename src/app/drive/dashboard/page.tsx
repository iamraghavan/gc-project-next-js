'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  BarChart as BarChartIcon,
  Users,
  GitBranch,
  ArrowUp,
  BrainCircuit,
  Loader,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import { getDashboardStats, type DashboardStats } from '@/services/dashboard'
import { getRepositories, getRepoDetails, type Repository } from '@/services/github'
import RepoSwitcher from '@/components/repo-switcher'
import { Skeleton } from '@/components/ui/skeleton'
import { summarizeDashboard } from '@/ai/flows/summarize-dashboard-flow'
import Markdown from 'react-markdown'
import { Button } from '@/components/ui/button'

const chartConfig = {
  uploads: {
    label: 'Uploads',
    color: 'hsl(var(--chart-1))',
  },
  actions: {
    label: 'User Actions',
    color: 'hsl(var(--chart-2))',
  },
}

function formatBytes(kb: number): string {
    if (kb === 0) return '0 KB';
    const sizes = ['KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(kb) / Math.log(1024));
    return parseFloat((kb / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}


export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [repositories, setRepositories] = React.useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = React.useState<Repository | null>(null)
  const [repoDetails, setRepoDetails] = React.useState<Repository | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSummaryLoading, setIsSummaryLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<string>("");

  React.useEffect(() => {
    getRepositories().then(setRepositories)
  }, [])
  
  React.useEffect(() => {
    if (selectedRepo) {
      setIsLoading(true)
      Promise.all([
        getDashboardStats(selectedRepo.full_name),
        getRepoDetails(selectedRepo.full_name),
      ])
        .then(([dashboardStats, repoDetails]) => {
          setStats(dashboardStats)
          setRepoDetails(repoDetails)
        })
        .finally(() => setIsLoading(false))
    } else if (repositories.length > 0) {
        // If no repo is selected but we have repos, select the first one
        setSelectedRepo(repositories[0]);
    } else if (repositories.length === 0 && !isLoading) {
        // No repositories found
        setIsLoading(false);
    }
  }, [selectedRepo, repositories, isLoading])
  
  const handleGenerateSummary = React.useCallback(async () => {
    if (!stats || !repoDetails || repositories.length === 0) return;
    setIsSummaryLoading(true);
    setSummary("");
    try {
        const result = await summarizeDashboard({
            stats: {
                activeUsers: stats.activeUsers,
                fileActivities24h: stats.fileActivities24h,
                totalStorageUsed: formatBytes(repoDetails.size),
                totalRepositories: repositories.length,
                monthlyUploads: stats.monthlyUploads,
                userActivity: stats.userActivity.map(d => ({ month: d.month, actions: d.value })),
            }
        });
        setSummary(result.summary);
    } catch(e) {
        console.error("Failed to generate summary", e);
        setSummary("Sorry, I was unable to generate a summary at this time.");
    } finally {
        setIsSummaryLoading(false);
    }
  }, [stats, repoDetails, repositories]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <RepoSwitcher onRepoChange={setSelectedRepo} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage Used</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-3/4" />
            ) : (
              <div className="text-2xl font-bold">{formatBytes(repoDetails?.size || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">{selectedRepo?.full_name || 'Select a repository'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats?.activeUsers}</div> }
            <p className="text-xs text-muted-foreground">in the last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repositories</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{repositories.length}</div> }
            <p className="text-xs text-muted-foreground">Total repositories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Activity</CardTitle>
            <ArrowUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats?.fileActivities24h}</div> }
            <p className="text-xs text-muted-foreground">actions in the last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>AI Summary</CardTitle>
             <CardDescription>An AI-generated summary of your dashboard activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {isSummaryLoading && (
                <div className="space-y-2 flex flex-col items-center justify-center h-48">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating summary...</p>
                </div>
            )}
            {!isSummaryLoading && summary && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Markdown>{summary}</Markdown>
                </div>
            )}
             {!isSummaryLoading && !summary && (
                <div className="text-center text-muted-foreground p-8 flex flex-col items-center gap-4">
                    <BrainCircuit className="h-10 w-10" />
                    <p>Click the button to generate an AI-powered summary of your dashboard!</p>
                    <Button onClick={handleGenerateSummary} disabled={isLoading}>
                       <BrainCircuit className="mr-2 h-4 w-4" />
                       Generate Summary
                    </Button>
                </div>
             )}
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Uploads</CardTitle>
            <CardDescription>File uploads over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats?.monthlyUploads}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  <Bar dataKey="uploads" fill="var(--color-uploads)" radius={4} name="Uploads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
       <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>
              Total user actions over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={stats?.userActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Legend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="actions" stroke="var(--color-actions)" strokeWidth={2} name="Actions" />
                    </LineChart>
                </ResponsiveContainer>
             )}
          </CardContent>
        </Card>
    </div>
  )
}
