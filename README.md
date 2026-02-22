# TalentClaw

Staffing workflows for OpenClaw: agents first, humans second.

## Table of Contents

- [What You Get](#what-you-get)
- [Requirements](#requirements)
- [Install](#install)
- [Quickstart](#quickstart)
- [How It Works](#how-it-works)
- [Value proposition](#value-proposition)
- [What the agent does](#what-the-agent-does)
- [Workflow logic and why it works](#workflow-logic-and-why-it-works)
- [Scoring Model](#scoring-model)
- [Pipeline States](#pipeline-states)
- [Dashboard](#dashboard-screens)
- [Security](#security)
- [Extending](#extending)
- [Architecture](#architecture)
- [CLI Commands](#cli-commands)
- [Skills Directory](#skills-directory)

**Quick reference:** Dashboard at `http://localhost:3334`

## What You Get

- Deterministic staffing workflows
- Role decomposition engine
- Agent pack sourcing + scoring
- Human sourcing + scoring
- Decision pack with tradeoff analysis
- Persistent hiring pipeline
- Feedback-based policy tuning

**Why it matters:** TalentClaw tries agents first so you only add human talent when automation can’t meet the bar. Every decision is traceable (same inputs → same workflow outcome), and scoring is rubric-based so choices are evidence-driven instead of gut feel. One pipeline tracks both agent packs and human candidates, with an explicit approval step before any contact.

## Requirements

- Node.js >= 20
- OpenClaw CLI or runtime available
- Local shell with cron (optional)

## Install

```bash
npm install
npm run build
npm link
```

## Quickstart

```bash
talentclaw install
talentclaw workflow run intake-and-roles "Hire for <goal>"
```

Use the `request_id` from the command output in the next steps.

```bash
talentclaw workflow run source-agents-first "<request-id>"
# Run only when the decision gate indicates human sourcing is needed (see [Architecture](#architecture)):
talentclaw workflow run source-humans-second "<request-id>"
talentclaw dashboard
```

## How It Works

intake -> roles -> agent sourcing -> decision gate -> human sourcing -> options -> feedback loop

## Value proposition

- **Agent-first:** Reduces cost and time-to-value by testing whether agent/workflow packs can satisfy the role before involving human candidates. You only run human sourcing when the decision gate says so.
- **Deterministic:** Same goal and role specs produce the same workflow path and scoring. Decisions are auditable and repeatable; no hidden variability.
- **Rubric-driven:** Every candidate (agent or human) is scored on the same dimensions (requirement fit, evidence strength, execution risk, maintainability, cost, speed). Missing a must-have caps the score at 60. No generic praise—pros and cons must map to requirements and risks.
- **One pipeline:** Both agent packs and human candidates move through the same states (sourced → shortlisted → contacted → … → hired/rejected). You compare options (agent-only, hybrid, human-first) in one place.
- **Explicit approval:** Moving to “contacted” or beyond requires human approval, so no accidental outreach. Feedback from decisions is used to tune policy and weights.

## What the agent does

Each workflow is a sequence of steps. Steps are either **agents** (LLM-backed, structured output) or **actions** (e.g. persist to DB, web search, approval gate).

**1. Intake and role definition (`intake-and-roles`)**

- **Context agent:** Turns your goal and constraints into a structured Hiring Context (timeline, budget, risk tolerance, existing resources). No invented data; unknowns stay marked.
- **Roles agent:** From that context, produces 1–3 concrete roles with scope, deliverables, success metrics, must-have and nice-to-have skills, and disqualifiers. Role names are specific (e.g. “OpenClaw Workflow Engineer”).
- **Action:** Role specs are persisted to the DB and linked to a new search request. You get a `request_id` for the next workflows.

**2. Agent sourcing (`source-agents-first`)**

- **Query builder agent:** From role specs, builds deterministic search queries for agent/workflow packs and (when needed later) for human candidates. Queries reflect must-haves and tech constraints.
- **Action:** Web search runs (e.g. for packs, repos, or OpenClaw-compatible workflows).
- **Researcher agent:** For each candidate, extracts structured evidence from the source: summary, skills, signals, risks. Does not assume; unconfirmed skills stay “unknown”.
- **Evaluator agent:** Scores each candidate on the rubric (requirement fit, evidence strength, execution risk, maintainability, cost fit, speed fit), applies the must-have cap, and outputs verdict (STRONG YES / YES / MAYBE / NO) plus pros/cons tied to requirements.
- **PM agent (decision gate):** Decides whether to stop with an agent-only option or to continue to human sourcing (see [Workflow logic](#workflow-logic-and-why-it-works)).

**3. Human sourcing (`source-humans-second`)**

- Same **query builder** and **web search** step, tuned for human candidates (e.g. LinkedIn, Upwork).
- **Researcher** and **Evaluator** again extract evidence and score against the same role spec.
- **Action:** Builds a decision pack with options (e.g. agent-only, hybrid, human-first), including coverage, pros/cons, cost and time estimates, and a recommended next step.
- **Action:** Approval gate—workflow pauses until a human approves before any candidate is marked as “contacted”.

## Workflow logic and why it works

**Why this order?**

1. **Intake first:** A clear goal and 1–3 role specs with must-haves give every later step a single source of truth. Sourcing and evaluation stay aligned to the same criteria.
2. **Agents before humans:** Agent packs are cheaper and faster to onboard. The system checks whether they meet the bar (coverage and risk) before spending effort on human sourcing.
3. **Decision gate in the middle:** After evaluating agents, the PM agent applies a simple rule: if **must-have coverage ≥ 80%** and **risk ≤ medium**, the run produces an **agent-only** option and **stops**. Otherwise it returns “continue to source humans.” So human sourcing runs only when automation is insufficient.
4. **Human sourcing when needed:** When the gate says “continue,” you run `source-humans-second`. That workflow adds human candidates, scores them with the same rubric, and builds a decision pack (agent-only vs hybrid vs human-first) with tradeoffs. No one is contacted until the approval gate is passed.

**Why it’s deterministic:** Role specs, rubric weights, and gate thresholds live in policy and DB. The same request and policy produce the same workflow path and scores. Feedback events can later adjust weights and preferences without changing the structure of the pipeline.

## Scoring Model

Rubric dimensions:

- Requirement Fit (0-10)
- Evidence Strength (0-10)
- Execution Risk (0-10, reverse)
- Maintainability (0-10)
- Cost Fit (0-10)
- Speed Fit (0-10)

Overall score is a weighted sum using `policy.rubric_weights_json`.

Hard rule:

- If any must-have missing, overall score is capped at `60`.

Verdicts:

- STRONG YES
- YES
- MAYBE
- NO

## Pipeline States

`sourced -> shortlisted -> contacted -> responded -> screening -> trial -> hired/rejected`

## Dashboard Screens

Runs on `http://localhost:3334`.

- Requests
- Role Specs
- Candidates
- Options Compare
- Pipeline Board
- Policy & Feedback
- Logs

## Security

- Local-first
- No credential storage
- Explicit approval required before contacting candidates
- Deterministic pipeline transitions

## Extending

- Add workflows under `resources/workflows/`
- Add rubric dimensions in policy and evaluator
- Add new sourcing connectors in workflow actions

## Architecture

### Persistence Layer (SQLite)

Database path: `.talentclaw/talentclaw.sqlite`

Tables:

- `search_requests`
- `role_specs`
- `candidates`
- `options`
- `pipeline_items`
- `feedback_events`
- `policy`
- `workflow_runs`

### Deterministic Workflow Set

- `intake-and-roles`
- `source-agents-first`
- `source-humans-second`

Agent-first decision gate:

- If coverage >= 80% and risk <= medium, produce Agent-only option and stop.
- Otherwise proceed to human sourcing.

### Agents

- `context`
- `roles`
- `query_builder`
- `researcher`
- `evaluator`
- `pm`

Definitions are in `resources/agents/*/AGENTS.md`.

## CLI Commands

Binary: `talentclaw`

Installation:

- `talentclaw install`
- `talentclaw uninstall`

Workflows:

- `talentclaw workflow list`
- `talentclaw workflow run intake-and-roles "<goal>"`
- `talentclaw workflow run source-agents-first <request-id>`
- `talentclaw workflow run source-humans-second <request-id>`
- `talentclaw workflow status <request-id>`

Candidates:

- `talentclaw candidates list`
- `talentclaw candidates view <id>`
- `talentclaw candidates shortlist <id>`
- `talentclaw candidates reject <id>`

Pipeline:

- `talentclaw pipeline board`
- `talentclaw pipeline move <candidate-id> <status> [--approve] [--next-action <text>]`

Policy:

- `talentclaw policy view`
- `talentclaw policy update --weights '{"requirement_fit":0.4,"evidence_strength":0.2,"execution_risk":0.1,"maintainability":0.1,"cost_fit":0.1,"speed_fit":0.1}'`

Dashboard:

- `talentclaw dashboard`
- `talentclaw dashboard stop`
- `talentclaw dashboard status`

## Skills Directory

These files are consumed by OpenClaw agents during workflow runs.

```
skills/
  talent-search/
    github_search.md
    profile_extraction.md
    query_templates.md
  evaluation/
    rubric.md
    pros_cons_format.md
    evidence_rules.md
  pipeline/
    pipeline_states.md
    pm_rules.md
    next_actions.md
  feedback/
    feedback_parser.md
    policy_update_rules.md
```

Each skill file contains:

- Rules
- Format constraints
- Example structured outputs
- Explicit do-not-guess instruction

TalentClaw is a deterministic staffing system that formalizes role definition, prioritizes agents before humans, enforces rubric-based evaluation, and maintains a hiring pipeline with structured tradeoff options and feedback-driven policy tuning.
