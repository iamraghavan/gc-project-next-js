'use server'

import { summarizeDashboard, type SummarizeDashboardInput } from '@/ai/flows/summarize-dashboard-flow'

export async function handleGenerateSummary(input: SummarizeDashboardInput) {
  try {
    const result = await summarizeDashboard(input)
    return { summary: result.summary, error: null }
  } catch (e: any) {
    console.error("Failed to generate summary", e)
    return { summary: null, error: "Sorry, I was unable to generate a summary at this time." }
  }
}
