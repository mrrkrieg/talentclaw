export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS search_requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  goal TEXT NOT NULL,
  constraints_json TEXT NOT NULL,
  resources_json TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS role_specs (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  role_name TEXT NOT NULL,
  scope_md TEXT NOT NULL,
  deliverables_md TEXT NOT NULL,
  success_metrics_json TEXT NOT NULL,
  must_have_json TEXT NOT NULL,
  nice_to_have_json TEXT NOT NULL,
  disqualifiers_json TEXT NOT NULL,
  FOREIGN KEY(request_id) REFERENCES search_requests(id)
);

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('agent', 'human')),
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT,
  summary_md TEXT,
  skills_json TEXT NOT NULL,
  signals_json TEXT NOT NULL,
  risks_json TEXT NOT NULL,
  score_overall REAL,
  score_breakdown_json TEXT,
  verdict TEXT,
  FOREIGN KEY(request_id) REFERENCES search_requests(id)
);

CREATE TABLE IF NOT EXISTS options (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  option_name TEXT NOT NULL,
  team_composition_json TEXT NOT NULL,
  coverage_json TEXT NOT NULL,
  pros_md TEXT NOT NULL,
  cons_md TEXT NOT NULL,
  cost_estimate_json TEXT NOT NULL,
  time_estimate_json TEXT NOT NULL,
  risk_estimate_json TEXT NOT NULL,
  recommended_next_step_md TEXT NOT NULL,
  FOREIGN KEY(request_id) REFERENCES search_requests(id)
);

CREATE TABLE IF NOT EXISTS pipeline_items (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('sourced', 'shortlisted', 'contacted', 'responded', 'screening', 'trial', 'hired', 'rejected')),
  owner TEXT,
  last_update_at TEXT NOT NULL,
  next_action_md TEXT NOT NULL,
  FOREIGN KEY(candidate_id) REFERENCES candidates(id)
);

CREATE TABLE IF NOT EXISTS feedback_events (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  structured_updates_json TEXT NOT NULL,
  FOREIGN KEY(request_id) REFERENCES search_requests(id)
);

CREATE TABLE IF NOT EXISTS policy (
  id TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  rubric_weights_json TEXT NOT NULL,
  default_preferences_json TEXT NOT NULL,
  disqualifiers_global_json TEXT NOT NULL,
  sourcing_templates_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  workflow_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL,
  log_json TEXT NOT NULL
);
`;
