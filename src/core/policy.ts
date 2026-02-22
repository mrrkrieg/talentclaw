import { getDb } from "../db/client.js";
import { id, nowIso, parseJson, stringify } from "./utils.js";
import type { CandidateScoreBreakdown, PolicyRecord, RubricWeights, Verdict } from "../types.js";

export const DEFAULT_WEIGHTS: RubricWeights = {
  requirement_fit: 0.3,
  evidence_strength: 0.2,
  execution_risk: 0.15,
  maintainability: 0.15,
  cost_fit: 0.1,
  speed_fit: 0.1,
};

export type PolicyModel = {
  id: string;
  updatedAt: string;
  rubricWeights: RubricWeights;
  defaultPreferences: { speed: number; cost: number; quality: number };
  disqualifiersGlobal: string[];
  sourcingTemplates: { agent: string[]; human: string[] };
};

export function ensurePolicy(): PolicyModel {
  const db = getDb();
  const row = db.prepare("SELECT * FROM policy LIMIT 1").get() as PolicyRecord | undefined;
  if (row) {
    return toPolicyModel(row);
  }

  const model: PolicyModel = {
    id: id("policy"),
    updatedAt: nowIso(),
    rubricWeights: DEFAULT_WEIGHTS,
    defaultPreferences: { speed: 0.33, cost: 0.33, quality: 0.34 },
    disqualifiersGlobal: [],
    sourcingTemplates: {
      agent: ["openclaw workflow pack {must_have} {constraints}"],
      human: ["openclaw workflow engineer {must_have} {constraints}"],
    },
  };

  db.prepare(
    `INSERT INTO policy (id, updated_at, rubric_weights_json, default_preferences_json, disqualifiers_global_json, sourcing_templates_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    model.id,
    model.updatedAt,
    stringify(model.rubricWeights),
    stringify(model.defaultPreferences),
    stringify(model.disqualifiersGlobal),
    stringify(model.sourcingTemplates)
  );

  return model;
}

export function updatePolicy(update: Partial<Omit<PolicyModel, "id">>): PolicyModel {
  const db = getDb();
  const current = ensurePolicy();
  const next: PolicyModel = {
    id: current.id,
    updatedAt: nowIso(),
    rubricWeights: update.rubricWeights ?? current.rubricWeights,
    defaultPreferences: update.defaultPreferences ?? current.defaultPreferences,
    disqualifiersGlobal: update.disqualifiersGlobal ?? current.disqualifiersGlobal,
    sourcingTemplates: update.sourcingTemplates ?? current.sourcingTemplates,
  };

  db.prepare(
    `UPDATE policy SET updated_at = ?, rubric_weights_json = ?, default_preferences_json = ?,
       disqualifiers_global_json = ?, sourcing_templates_json = ? WHERE id = ?`
  ).run(
    next.updatedAt,
    stringify(next.rubricWeights),
    stringify(next.defaultPreferences),
    stringify(next.disqualifiersGlobal),
    stringify(next.sourcingTemplates),
    next.id
  );

  return next;
}

export function scoreCandidate(
  scores: CandidateScoreBreakdown,
  weights: RubricWeights,
  hasMissingMustHave: boolean
): { overall: number; verdict: Verdict } {
  const weightedRaw =
    scores.requirement_fit * weights.requirement_fit +
    scores.evidence_strength * weights.evidence_strength +
    scores.execution_risk * weights.execution_risk +
    scores.maintainability * weights.maintainability +
    scores.cost_fit * weights.cost_fit +
    scores.speed_fit * weights.speed_fit;

  let overall = Math.round(weightedRaw * 10);
  if (hasMissingMustHave) {
    overall = Math.min(overall, 60);
  }

  const verdict =
    overall >= 85 ? "STRONG YES" :
    overall >= 70 ? "YES" :
    overall >= 50 ? "MAYBE" : "NO";

  return { overall, verdict };
}

function toPolicyModel(row: PolicyRecord): PolicyModel {
  return {
    id: row.id,
    updatedAt: row.updated_at,
    rubricWeights: parseJson<RubricWeights>(row.rubric_weights_json),
    defaultPreferences: parseJson<{ speed: number; cost: number; quality: number }>(row.default_preferences_json),
    disqualifiersGlobal: parseJson<string[]>(row.disqualifiers_global_json),
    sourcingTemplates: parseJson<{ agent: string[]; human: string[] }>(row.sourcing_templates_json),
  };
}
