import express from "express";
import { getDb } from "../db/client.js";
import { ensurePolicy } from "../core/policy.js";

const PORT = 3334;

let server: ReturnType<typeof app.listen> | null = null;
const app = express();

app.get("/", (_req, res) => {
  res.send(renderLayout("Requests", renderRequests()));
});

app.get("/role-specs", (_req, res) => {
  const db = getDb();
  const roles = db.prepare("SELECT request_id, role_name, deliverables_md, must_have_json, nice_to_have_json, disqualifiers_json FROM role_specs ORDER BY request_id, role_name").all() as Array<Record<string, string>>;
  const body = roles
    .map((r) => `<article class=\"card\"><h3>${escapeHtml(r.role_name)}</h3><p><b>Request:</b> ${escapeHtml(r.request_id)}</p><p><b>Deliverables</b><br>${escapeHtml(r.deliverables_md).replace(/\n/g, "<br>")}</p><p><b>Must-haves:</b> ${escapeHtml(r.must_have_json)}</p><p><b>Nice-to-haves:</b> ${escapeHtml(r.nice_to_have_json)}</p><p><b>Disqualifiers:</b> ${escapeHtml(r.disqualifiers_json)}</p></article>`)
    .join("");
  res.send(renderLayout("Role Specs", body || "<p>No role specs yet.</p>"));
});

app.get("/candidates", (_req, res) => {
  const db = getDb();
  const candidates = db.prepare("SELECT id, name, type, source, score_overall, verdict, risks_json FROM candidates ORDER BY type, score_overall DESC").all() as Array<Record<string, unknown>>;
  const rows = candidates
    .map(
      (c) => `<tr><td>${escapeHtml(String(c.name))}</td><td>${escapeHtml(String(c.type))}</td><td>${escapeHtml(String(c.score_overall ?? "-"))}</td><td>${escapeHtml(String(c.verdict ?? "-"))}</td><td>${escapeHtml(String(c.risks_json ?? "[]"))}</td><td>${escapeHtml(String(c.source))}</td></tr>`
    )
    .join("");

  const body = `<table><thead><tr><th>Name</th><th>Type</th><th>Overall Score</th><th>Verdict</th><th>Risk</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table>`;
  res.send(renderLayout("Candidates", body));
});

app.get("/options", (_req, res) => {
  const db = getDb();
  const options = db.prepare("SELECT option_name, team_composition_json, coverage_json, cost_estimate_json, time_estimate_json, risk_estimate_json, pros_md, cons_md FROM options ORDER BY option_name").all() as Array<Record<string, string>>;
  const body = options
    .map((o) => `<article class=\"card\"><h3>${escapeHtml(o.option_name)}</h3><p><b>Team:</b> ${escapeHtml(o.team_composition_json)}</p><p><b>Coverage:</b> ${escapeHtml(o.coverage_json)}</p><p><b>Cost:</b> ${escapeHtml(o.cost_estimate_json)}</p><p><b>Timeline:</b> ${escapeHtml(o.time_estimate_json)}</p><p><b>Risk:</b> ${escapeHtml(o.risk_estimate_json)}</p><p><b>Pros:</b> ${escapeHtml(o.pros_md)}</p><p><b>Cons:</b> ${escapeHtml(o.cons_md)}</p></article>`)
    .join("");
  res.send(renderLayout("Options Compare", body || "<p>No options generated yet.</p>"));
});

app.get("/pipeline", (_req, res) => {
  const db = getDb();
  const items = db.prepare(
    `SELECT p.status, c.name, c.type, c.score_overall, p.next_action_md
     FROM pipeline_items p JOIN candidates c ON c.id = p.candidate_id
     ORDER BY p.last_update_at DESC`
  ).all() as Array<Record<string, unknown>>;

  const columns = ["sourced", "shortlisted", "contacted", "responded", "screening", "trial", "hired", "rejected"];
  const board = columns
    .map((status) => {
      const cards = items
        .filter((i) => i.status === status)
        .map((i) => `<div class=\"card\"><b>${escapeHtml(String(i.name))}</b><br>${escapeHtml(String(i.type))} | Score: ${escapeHtml(String(i.score_overall ?? "-"))}<br><small>${escapeHtml(String(i.next_action_md ?? ""))}</small></div>`)
        .join("");
      return `<section class=\"col\"><h3>${status}</h3>${cards || "<p>Empty</p>"}</section>`;
    })
    .join("");

  res.send(renderLayout("Pipeline Board", `<div class=\"board\">${board}</div>`));
});

app.get("/policy", (_req, res) => {
  const policy = ensurePolicy();
  const body = `<article class=\"card\"><h3>Current Policy</h3><pre>${escapeHtml(JSON.stringify(policy, null, 2))}</pre></article>`;
  res.send(renderLayout("Policy & Feedback", body));
});

app.get("/logs", (_req, res) => {
  const db = getDb();
  const logs = db.prepare("SELECT workflow_id, request_id, started_at, ended_at, status, log_json FROM workflow_runs ORDER BY started_at DESC").all() as Array<Record<string, string>>;
  const body = logs
    .map((l) => `<article class=\"card\"><h3>${escapeHtml(l.workflow_id)}</h3><p><b>Request:</b> ${escapeHtml(l.request_id ?? "")}</p><p><b>Status:</b> ${escapeHtml(l.status)}</p><p><b>Started:</b> ${escapeHtml(l.started_at)}</p><p><b>Ended:</b> ${escapeHtml(l.ended_at ?? "")}</p><pre>${escapeHtml(l.log_json)}</pre></article>`)
    .join("");
  res.send(renderLayout("Logs", body || "<p>No workflow logs yet.</p>"));
});

export function startDashboard(): void {
  if (server) {
    return;
  }

  server = app.listen(PORT, () => {
    process.stdout.write(`TalentClaw dashboard running on http://localhost:${PORT}\n`);
  });
}

export function stopDashboard(): void {
  if (!server) {
    return;
  }

  server.close();
  server = null;
}

function renderRequests(): string {
  const db = getDb();
  const rows = db.prepare("SELECT id, goal, created_at FROM search_requests ORDER BY created_at DESC").all() as Array<Record<string, string>>;
  const bodyRows = rows
    .map((r) => `<tr><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.goal)}</td><td>${escapeHtml(r.created_at)}</td><td><a href=\"/role-specs\">View Roles</a></td></tr>`)
    .join("");
  return `<table><thead><tr><th>Request ID</th><th>Goal</th><th>Created</th><th>Actions</th></tr></thead><tbody>${bodyRows}</tbody></table>`;
}

function renderLayout(title: string, body: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset=\"utf-8\" />
<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
<title>TalentClaw - ${escapeHtml(title)}</title>
<style>
  body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:#f5f7fa;color:#12202f;display:grid;grid-template-columns:240px 1fr;min-height:100vh}
  nav{background:#0f172a;color:#fff;padding:16px}
  nav h1{font-size:18px;margin-top:0}
  nav a{display:block;color:#cbd5e1;text-decoration:none;padding:8px 0}
  nav a:hover{color:#fff}
  main{padding:16px;overflow:auto}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dce3eb}
  th,td{padding:10px;border-bottom:1px solid #e5ebf2;text-align:left;vertical-align:top}
  .card{background:#fff;border:1px solid #dce3eb;border-radius:8px;padding:12px;margin-bottom:12px}
  .board{display:grid;grid-template-columns:repeat(4,minmax(190px,1fr));gap:12px}
  .col{background:#eef2f7;border:1px solid #dce3eb;border-radius:8px;padding:8px;min-height:120px}
  pre{background:#081226;color:#d3e2ff;padding:10px;border-radius:6px;overflow:auto}
  @media(max-width:900px){body{grid-template-columns:1fr}.board{grid-template-columns:repeat(2,minmax(120px,1fr))}}
</style>
</head>
<body>
<nav>
  <h1>TalentClaw</h1>
  <a href=\"/\">Requests</a>
  <a href=\"/role-specs\">Role Specs</a>
  <a href=\"/candidates\">Candidates</a>
  <a href=\"/options\">Options</a>
  <a href=\"/pipeline\">Pipeline</a>
  <a href=\"/policy\">Policy</a>
  <a href=\"/logs\">Logs</a>
</nav>
<main>
  <h2>${escapeHtml(title)}</h2>
  ${body}
</main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
