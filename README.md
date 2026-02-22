# TalentClaw

Staffing workflows for OpenClaw: agents first, humans second.

## Table of Contents

- [What You Get](#what-you-get)
- [Requirements](#requirements)
- [Install](#install)
- [Quickstart](#quickstart)
- [How It Works](#how-it-works)
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
