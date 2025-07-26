'use server';
/**
 * @fileOverview An AI flow to summarize dashboard data.
 *
 * - summarizeDashboard - A function that provides a summary of dashboard statistics.
 * - SummarizeDashboardInput - The input type for the summarizeDashboard function.
 * - SummarizeDashboardOutput - The return type for the summarizeDashboard function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeDashboardInputSchema = z.object({
  stats: z.object({
    activeUsers: z.number().describe('The number of active users in the last 30 days.'),
    fileActivities24h: z.number().describe('The number of file activities in the last 24 hours.'),
    totalStorageUsed: z.string().describe('The total storage used by the repository (e.g., "12.5 MB").'),
    totalRepositories: z.number().describe('The total number of repositories.'),
    monthlyUploads: z.array(z.object({ month: z.string(), uploads: z.number() })).describe('The number of uploads per month for the last 6 months.'),
    userActivity: z.array(z.object({ month: z.string(), actions: z.number() })).describe('The number of user actions per month for the last 6 months.'),
  }),
});
export type SummarizeDashboardInput = z.infer<typeof SummarizeDashboardInputSchema>;

const SummarizeDashboardOutputSchema = z.object({
  summary: z.string().describe('A concise, insightful, and friendly summary of the dashboard statistics. Highlight interesting trends, potential concerns, or positive achievements. Use markdown for formatting.'),
});
export type SummarizeDashboardOutput = z.infer<typeof SummarizeDashboardOutputSchema>;

export async function summarizeDashboard(input: SummarizeDashboardInput): Promise<SummarizeDashboardOutput> {
  return summarizeDashboardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDashboardPrompt',
  input: { schema: SummarizeDashboardInputSchema },
  output: { schema: SummarizeDashboardOutputSchema },
  prompt: `You are a helpful AI assistant for an application called GitDrive. Your task is to provide a summary of the user's dashboard.

Analyze the following statistics and generate a human-readable summary. The summary should be concise (2-3 short paragraphs), highlight key metrics, and point out any notable trends or interesting data points.

**Dashboard Statistics:**
- **Total Repositories:** {{{stats.totalRepositories}}}
- **Total Storage Used:** {{{stats.totalStorageUsed}}}
- **Active Users (30 days):** {{{stats.activeUsers}}}
- **File Activities (24 hours):** {{{stats.fileActivities24h}}}

**Monthly Uploads (Last 6 Months):**
{{#each stats.monthlyUploads}}
- {{{month}}}: {{{uploads}}} uploads
{{/each}}

**Monthly User Activity (Last 6 Months):**
{{#each stats.userActivity}}
- {{{month}}}: {{{actions}}} actions
{{/each}}

Please provide a friendly and insightful summary based on this data. Use markdown for bolding and bullet points if needed.
`,
});

const summarizeDashboardFlow = ai.defineFlow(
  {
    name: 'summarizeDashboardFlow',
    inputSchema: SummarizeDashboardInputSchema,
    outputSchema: SummarizeDashboardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
