export type CandidateType = "agent" | "human";

export type PipelineStatus =
  | "sourced"
  | "shortlisted"
  | "contacted"
  | "responded"
  | "screening"
  | "trial"
  | "hired"
  | "rejected";

export type Verdict = "STRONG YES" | "YES" | "MAYBE" | "NO";

export type RubricWeights = {
  requirement_fit: number;
  evidence_strength: number;
  execution_risk: number;
  maintainability: number;
  cost_fit: number;
  speed_fit: number;
};

export type PolicyRecord = {
  id: string;
  updated_at: string;
  rubric_weights_json: string;
  default_preferences_json: string;
  disqualifiers_global_json: string;
  sourcing_templates_json: string;
};

export type CandidateScoreBreakdown = {
  requirement_fit: number;
  evidence_strength: number;
  execution_risk: number;
  maintainability: number;
  cost_fit: number;
  speed_fit: number;
};

export type SearchRequest = {
  id: string;
  created_at: string;
  goal: string;
  constraints_json: string;
  resources_json: string;
  notes: string | null;
};
