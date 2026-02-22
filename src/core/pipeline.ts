import { getDb } from "../db/client.js";
import type { PipelineStatus } from "../types.js";
import { id, nowIso } from "./utils.js";

const ORDER: PipelineStatus[] = [
  "sourced",
  "shortlisted",
  "contacted",
  "responded",
  "screening",
  "trial",
  "hired",
  "rejected",
];

export function validateTransition(params: {
  current: PipelineStatus;
  next: PipelineStatus;
  overallScore: number | null;
  shortlistThreshold: number;
  hasApproval: boolean;
  hasDisqualifierViolation: boolean;
}): { ok: boolean; reason: string } {
  const { current, next, overallScore, shortlistThreshold, hasApproval, hasDisqualifierViolation } = params;

  if (hasDisqualifierViolation && next !== "rejected") {
    return { ok: false, reason: "Candidate violates disqualifier and must move to rejected." };
  }

  if (current === "hired" || current === "rejected") {
    return { ok: false, reason: "Terminal states cannot transition." };
  }

  if (next === "shortlisted" && (overallScore ?? 0) < shortlistThreshold) {
    return { ok: false, reason: `Overall score must be >= ${shortlistThreshold} to shortlist.` };
  }

  if (next === "contacted" && !hasApproval) {
    return { ok: false, reason: "Cannot contact candidate without explicit human approval." };
  }

  if (next === current) {
    return { ok: true, reason: "No change" };
  }

  const curIdx = ORDER.indexOf(current);
  const nextIdx = ORDER.indexOf(next);
  if (curIdx === -1 || nextIdx === -1) {
    return { ok: false, reason: "Unknown pipeline status." };
  }

  if (next === "rejected") {
    return { ok: true, reason: "Moved to rejected." };
  }

  if (nextIdx - curIdx !== 1) {
    return { ok: false, reason: "Transitions must move exactly one stage forward (except rejected)." };
  }

  return { ok: true, reason: "Valid transition." };
}

export function ensurePipelineItem(candidateId: string): void {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM pipeline_items WHERE candidate_id = ?").get(candidateId) as { id: string } | undefined;
  if (existing) {
    return;
  }

  db.prepare(
    `INSERT INTO pipeline_items (id, candidate_id, status, owner, last_update_at, next_action_md)
     VALUES (?, ?, 'sourced', '', ?, 'Review candidate profile')`
  ).run(id("pipe"), candidateId, nowIso());
}
