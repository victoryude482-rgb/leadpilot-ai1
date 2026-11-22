import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const statusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("succeeded"),
  v.literal("failed"),
);

export const record = mutation({
  args: {
    ingestKey: v.string(),
    companyId: v.string(),
    taskId: v.string(),
    userId: v.string(),
    title: v.string(),
    agent: v.string(),
    status: statusValidator,
    message: v.string(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const expectedKey = process.env.LEADPILOT_ACTIVITY_INGEST_KEY;
    if (!expectedKey || args.ingestKey !== expectedKey) {
      throw new Error("Unauthorized activity ingestion.");
    }

    const { ingestKey: _ingestKey, ...record } = args;
    const existing = await ctx.db
      .query("agentActivity")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .unique();

    if (existing) {
      if (
        existing.companyId !== args.companyId ||
        existing.userId !== args.userId
      ) {
        throw new Error("Task ownership mismatch.");
      }
      await ctx.db.patch(existing._id, {
        ...record,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("agentActivity", {
      ...record,
      updatedAt: Date.now(),
    });
  },
});

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit = Math.min(Math.max(Math.floor(args.limit ?? 12), 1), 50);
    return await ctx.db
      .query("agentActivity")
      .withIndex("by_user_updated", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit);
  },
});
