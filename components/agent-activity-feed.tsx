"use client";

import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";

type Activity = {
  _id: string;
  title: string;
  agent: string;
  status: "queued" | "running" | "succeeded" | "failed";
  message: string;
  updatedAt: number;
  errorCode?: string;
};

const listMine = makeFunctionReference<"query">("agentActivity:listMine");

export function AgentActivityFeed() {
  const activities = useQuery(listMine, { limit: 12 }) as Activity[] | undefined;

  return (
    <section className="panel" aria-live="polite">
      <p className="eyebrow">REAL-TIME AGENT ACTIVITY</p>
      <h2>Live activity feed</h2>
      {activities === undefined ? (
        <p className="muted">Connecting to your secure activity stream…</p>
      ) : activities.length === 0 ? (
        <p className="muted">No agent activity yet. Run a research task to see updates here.</p>
      ) : (
        <div className="activity-feed-list">
          {activities.map((activity) => (
            <article className="activity-feed-item" key={activity._id}>
              <div className="activity-feed-copy">
                <strong>{activity.title}</strong>
                <span>{activity.agent.replaceAll("-", " ")}</span>
                <p>{activity.message}</p>
                <small>{new Date(activity.updatedAt).toLocaleString()}</small>
              </div>
              <span className={"activity-feed-status status-" + activity.status}>
                {activity.status}
              </span>
            </article>
          ))}
        </div>
      )}
      <style>{`
        .activity-feed-list{display:grid;gap:0}
        .activity-feed-item{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:14px 0;border-top:1px solid #203243}
        .activity-feed-copy{display:grid;gap:5px;min-width:0}
        .activity-feed-copy strong{font-size:13px;color:#eaf2f8}
        .activity-feed-copy span,.activity-feed-copy small{font-size:10px;color:#91a5b5;text-transform:capitalize}
        .activity-feed-copy p{margin:0;color:#b4c4d0;font-size:12px;line-height:1.5}
        .activity-feed-status{font-size:10px;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;border-radius:999px;padding:5px 8px;background:#243849;color:#c8d6e0}
        .activity-feed-status.status-running{background:#173b4a;color:#7dd3fc}
        .activity-feed-status.status-succeeded{background:#153b32;color:#74dfbd}
        .activity-feed-status.status-failed{background:#49262c;color:#fda4af}
        @media(max-width:420px){.activity-feed-item{display:grid}.activity-feed-status{justify-self:start}}
      `}</style>
    </section>
  );
}
