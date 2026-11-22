import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agentActivity: defineTable({
    companyId: v.string(),
    taskId: v.string(),
    userId: v.string(),
    title: v.string(),
    agent: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed"),
    ),
    message: v.string(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
    errorCode: v.optional(v.string()),
  })
    .index("by_task", ["taskId"])
    .index("by_user_updated", ["userId", "updatedAt"]),
});
