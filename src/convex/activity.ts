import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

type ActivityStatus = "queued" | "running" | "succeeded" | "failed";

type ActivityInput = {
  companyId: string;
  taskId: string;
  userId: string;
  title: string;
  agent: string;
  status: ActivityStatus;
  message: string;
  startedAt?: number;
  completedAt?: number;
  errorCode?: string;
};

const recordActivity = makeFunctionReference<"mutation">("agentActivity:record");

export async function publishAgentActivity(input: ActivityInput): Promise<void> {
  const deploymentUrl =
    process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  const ingestKey = process.env.LEADPILOT_ACTIVITY_INGEST_KEY;

  // Convex is an optional activity layer: existing Supabase task execution
  // must continue to work until the Convex deployment is configured.
  if (!deploymentUrl || !ingestKey) return;

  try {
    const client = new ConvexHttpClient(deploymentUrl);
    await client.mutation(recordActivity, { ...input, ingestKey });
  } catch {
    // Do not fail a lead-research task because the activity feed is offline.
  }
}
