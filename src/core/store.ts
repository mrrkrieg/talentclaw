import { getDb } from "../db/client.js";
import type { CandidateScoreBreakdown, CandidateType, PipelineStatus, RubricWeights, Verdict } from "../types.js";
import { ensurePolicy, scoreCandidate, updatePolicy } from "./policy.js";
import { ensurePipelineItem, validateTransition } from "./pipeline.js";
import { id, nowIso, parseJson, stringify } from "./utils.js";

export type RoleInput = {
  roleName: string;
  scope: string;
  deliverables: string[];
  successMetrics: string[];
  mustHave: string[];
  niceToHave: string[];
  disqualifiers: string[];
};

export type CandidateInput = {
  requestId: string;
  type: CandidateType;
  name: string;
  source: string;
  url?: string;
  summary: string;
  skills: string[];
  signals: string[];
  risks: string[];
};

export function createSearchRequest(goal: string): { requestId: string } {
  const db = getDb();
  ensurePolicy();
  const requestId = id("req");
  db.prepare(
    `INSERT INTO search_requests (id, created_at, goal, constraints_json, resources_json, notes)
     VALUES (?, ?, ?, '[]', '[]', '')`
  ).run(requestId, nowIso(), goal);
  return { requestId };
}

export function listSearchRequests(): Array<{ id: string; created_at: string; goal: string }> {
  const db = getDb();
  return db.prepare("SELECT id, created_at, goal FROM search_requests ORDER BY created_at DESC").all() as Array<{ id: string; created_at: string; goal: string }>;
}

export function upsertRoles(requestId: string, roles: RoleInput[]): void {
  if (roles.length > 3) {
    throw new Error("Max 3 roles allowed per request.");
  }

  const db = getDb();
  db.prepare("DELETE FROM role_specs WHERE request_id = ?").run(requestId);

  const insert = db.prepare(
    `INSERT INTO role_specs (
      id, request_id, role_name, scope_md, deliverables_md, success_metrics_json,
      must_have_json, nice_to_have_json, disqualifiers_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const role of roles) {
    insert.run(
      id("role"),
      requestId,
      role.roleName,
      role.scope,
      role.deliverables.join("\n"),
      stringify(role.successMetrics),
      stringify(role.mustHave),
      stringify(role.niceToHave),
      stringify(role.disqualifiers)
    );
  }
}

export function getRoles(requestId: string): RoleInput[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM role_specs WHERE request_id = ? ORDER BY role_name").all(requestId) as Array<Record<string, string>>;
  return rows.map((row) => ({
    roleName: row.role_name,
    scope: row.scope_md,
    deliverables: row.deliverables_md ? row.deliverables_md.split("\n") : [],
    successMetrics: parseJson<string[]>(row.success_metrics_json),
    mustHave: parseJson<string[]>(row.must_have_json),
    niceToHave: parseJson<string[]>(row.nice_to_have_json),
    disqualifiers: parseJson<string[]>(row.disqualifiers_json),
  }));
}

export function addCandidate(input: CandidateInput): { candidateId: string } {
  const db = getDb();
  const candidateId = id("cand");

  db.prepare(
    `INSERT INTO candidates (
      id, request_id, type, name, source, url, summary_md, skills_json, signals_json, risks_json,
      score_overall, score_breakdown_json, verdict
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`
  ).run(
    candidateId,
    input.requestId,
    input.type,
    input.name,
    input.source,
    input.url ?? "",
    input.summary,
    stringify(input.skills),
    stringify(input.signals),
    stringify(input.risks)
  );

  ensurePipelineItem(candidateId);
  return { candidateId };
}

export function listCandidates(requestId?: string, type?: CandidateType): Array<Record<string, unknown>> {
  const db = getDb();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (requestId) {
    clauses.push("request_id = ?");
    params.push(requestId);
  }
  if (type) {
    clauses.push("type = ?");
    params.push(type);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const sql = `SELECT id, request_id, type, name, source, url, score_overall, verdict FROM candidates ${where} ORDER BY score_overall DESC, name`;
  return db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
}

export function evaluateCandidate(params: {
  candidateId: string;
  roleMustHaves: string[];
  scoreBreakdown: CandidateScoreBreakdown;
  pros: string[];
  cons: string[];
}): { overall: number; verdict: Verdict } {
  const db = getDb();
  const candidate = db.prepare("SELECT skills_json FROM candidates WHERE id = ?").get(params.candidateId) as { skills_json: string } | undefined;
  if (!candidate) {
    throw new Error(`Candidate not found: ${params.candidateId}`);
  }

  const policy = ensurePolicy();
  const skills = parseJson<string[]>(candidate.skills_json).map((s) => s.toLowerCase());
  const missingMustHave = params.roleMustHaves.some((must) => !skills.includes(must.toLowerCase()));

  const result = scoreCandidate(params.scoreBreakdown, policy.rubricWeights, missingMustHave);

  db.prepare(
    `UPDATE candidates SET score_overall = ?, score_breakdown_json = ?, verdict = ? WHERE id = ?`
  ).run(
    result.overall,
    stringify({ ...params.scoreBreakdown, pros: params.pros, cons: params.cons, missingMustHave }),
    result.verdict,
    params.candidateId
  );

  return result;
}

export function upsertOptions(requestId: string, options: Array<{
  optionName: string;
  teamComposition: unknown;
  coverage: unknown;
  pros: string;
  cons: string;
  costEstimate: unknown;
  timeEstimate: unknown;
  riskEstimate: unknown;
  recommendedNextStep: string;
}>): void {
  const db = getDb();
  db.prepare("DELETE FROM options WHERE request_id = ?").run(requestId);

  const stmt = db.prepare(
    `INSERT INTO options (
      id, request_id, option_name, team_composition_json, coverage_json, pros_md, cons_md,
      cost_estimate_json, time_estimate_json, risk_estimate_json, recommended_next_step_md
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const option of options) {
    stmt.run(
      id("opt"),
      requestId,
      option.optionName,
      stringify(option.teamComposition),
      stringify(option.coverage),
      option.pros,
      option.cons,
      stringify(option.costEstimate),
      stringify(option.timeEstimate),
      stringify(option.riskEstimate),
      option.recommendedNextStep
    );
  }
}

export function movePipeline(candidateId: string, nextStatus: PipelineStatus, nextAction: string, hasApproval = false): { newStatus: PipelineStatus; reason: string } {
  const db = getDb();
  const row = db.prepare(
    `SELECT p.status, c.score_overall, c.risks_json
     FROM pipeline_items p
     JOIN candidates c ON c.id = p.candidate_id
     WHERE p.candidate_id = ?`
  ).get(candidateId) as { status: PipelineStatus; score_overall: number | null; risks_json: string } | undefined;

  if (!row) {
    throw new Error("Pipeline item not found.");
  }

  const policy = ensurePolicy();
  const risks = parseJson<string[]>(row.risks_json).map((r) => r.toLowerCase());
  const hasDisqualifierViolation = policy.disqualifiersGlobal.some((d) => risks.includes(d.toLowerCase()));

  const check = validateTransition({
    current: row.status,
    next: nextStatus,
    overallScore: row.score_overall,
    shortlistThreshold: 70,
    hasApproval,
    hasDisqualifierViolation,
  });

  if (!check.ok) {
    throw new Error(check.reason);
  }

  db.prepare(
    `UPDATE pipeline_items SET status = ?, last_update_at = ?, next_action_md = ? WHERE candidate_id = ?`
  ).run(nextStatus, nowIso(), nextAction, candidateId);

  return { newStatus: nextStatus, reason: check.reason };
}

export function getPipelineBoard(): Array<{ candidate_id: string; name: string; status: PipelineStatus; score_overall: number | null; type: string; next_action_md: string }> {
  const db = getDb();
  return db.prepare(
    `SELECT p.candidate_id, c.name, p.status, c.score_overall, c.type, p.next_action_md
     FROM pipeline_items p
     JOIN candidates c ON c.id = p.candidate_id
     ORDER BY p.last_update_at DESC`
  ).all() as Array<{ candidate_id: string; name: string; status: PipelineStatus; score_overall: number | null; type: string; next_action_md: string }>;
}

export function addFeedback(requestId: string, feedbackText: string): { feedbackId: string } {
  const db = getDb();
  const feedbackId = id("fdbk");

  const updates = parseFeedbackToPolicy(feedbackText);
  db.prepare(
    `INSERT INTO feedback_events (id, request_id, created_at, feedback_text, structured_updates_json)
     VALUES (?, ?, ?, ?, ?)`
  ).run(feedbackId, requestId, nowIso(), feedbackText, stringify(updates));

  const current = ensurePolicy();
  updatePolicy({
    rubricWeights: updates.rubricWeights ?? current.rubricWeights,
    disqualifiersGlobal: updates.disqualifiersGlobal ? [...current.disqualifiersGlobal, ...updates.disqualifiersGlobal] : current.disqualifiersGlobal,
    defaultPreferences: updates.defaultPreferences ?? current.defaultPreferences,
    sourcingTemplates: updates.sourcingTemplates ?? current.sourcingTemplates,
  });

  return { feedbackId };
}

export function getPolicyView(): Record<string, unknown> {
  const policy = ensurePolicy();
  return policy;
}

export function updateRubricWeights(patch: Partial<Record<keyof CandidateScoreBreakdown, number>>): Record<string, unknown> {
  const current = ensurePolicy();
  const next = {
    ...current.rubricWeights,
    ...patch,
  };
  const total = Object.values(next).reduce((acc, v) => acc + v, 0);
  if (Math.abs(total - 1) > 0.001) {
    throw new Error("Rubric weights must sum to 1.");
  }

  return updatePolicy({ rubricWeights: next });
}

function parseFeedbackToPolicy(feedbackText: string): {
  rubricWeights?: RubricWeights;
  disqualifiersGlobal?: string[];
  defaultPreferences?: { speed: number; cost: number; quality: number };
  sourcingTemplates?: { agent: string[]; human: string[] };
} {
  const lower = feedbackText.toLowerCase();
  const updates: {
    rubricWeights?: RubricWeights;
    disqualifiersGlobal?: string[];
    defaultPreferences?: { speed: number; cost: number; quality: number };
    sourcingTemplates?: { agent: string[]; human: string[] };
  } = {};

  if (lower.includes("prioritize speed")) {
    updates.defaultPreferences = { speed: 0.5, cost: 0.2, quality: 0.3 };
  } else if (lower.includes("prioritize cost")) {
    updates.defaultPreferences = { speed: 0.2, cost: 0.5, quality: 0.3 };
  } else if (lower.includes("prioritize quality")) {
    updates.defaultPreferences = { speed: 0.2, cost: 0.2, quality: 0.6 };
  }

  const disqualifierPrefix = "disqualifier:";
  if (lower.includes(disqualifierPrefix)) {
    const entries = feedbackText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.toLowerCase().startsWith(disqualifierPrefix))
      .map((line) => line.slice(disqualifierPrefix.length).trim())
      .filter(Boolean);
    if (entries.length) {
      updates.disqualifiersGlobal = entries;
    }
  }

  return updates;
}
