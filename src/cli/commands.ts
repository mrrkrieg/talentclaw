import { Command } from "commander";
import {
  addFeedback,
  addCandidate,
  createSearchRequest,
  getPipelineBoard,
  getPolicyView,
  listCandidates,
  listSearchRequests,
  movePipeline,
  updateRubricWeights,
} from "../core/store.js";
import { listWorkflowDefs, runWorkflow } from "../core/workflows.js";
import { startDashboard, stopDashboard } from "../dashboard/server.js";
import type { PipelineStatus } from "../types.js";

let dashboardRunning = false;

export function buildCli(): Command {
  const program = new Command();

  program
    .name("talentclaw")
    .description("Staffing workflows for OpenClaw: agents first, humans second.")
    .version("0.1.0");

  program.command("install").action(() => {
    process.stdout.write("TalentClaw installed in current workspace.\n");
  });

  program.command("uninstall").action(() => {
    process.stdout.write("TalentClaw uninstall is manual in v0.1 (remove .talentclaw and package files).\n");
  });

  const workflow = program.command("workflow").description("Workflow commands");

  workflow.command("list").action(() => {
    const defs = listWorkflowDefs();
    process.stdout.write(`${JSON.stringify(defs, null, 2)}\n`);
  });

  workflow
    .command("run")
    .argument("<workflow-id>")
    .argument("<arg>")
    .action((workflowId, arg) => {
      const result = runWorkflow(workflowId, arg);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  workflow
    .command("status")
    .argument("<request-id>")
    .action((requestId) => {
      const candidates = listCandidates(requestId);
      const pipeline = getPipelineBoard().filter((p) => candidates.some((c) => c.id === p.candidate_id));
      process.stdout.write(`${JSON.stringify({ requestId, candidates, pipeline }, null, 2)}\n`);
    });

  const candidates = program.command("candidates").description("Candidate commands");

  candidates.command("list").action(() => {
    process.stdout.write(`${JSON.stringify(listCandidates(), null, 2)}\n`);
  });

  candidates
    .command("view")
    .argument("<id>")
    .action((id) => {
      const row = listCandidates().find((c) => c.id === id);
      if (!row) {
        throw new Error(`Candidate not found: ${id}`);
      }
      process.stdout.write(`${JSON.stringify(row, null, 2)}\n`);
    });

  candidates
    .command("shortlist")
    .argument("<id>")
    .action((id) => {
      const result = movePipeline(id, "shortlisted", "Prepare outreach plan");
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  candidates
    .command("reject")
    .argument("<id>")
    .action((id) => {
      const result = movePipeline(id, "rejected", "Archive profile and record reason");
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  const pipeline = program.command("pipeline").description("Pipeline commands");

  pipeline.command("board").action(() => {
    process.stdout.write(`${JSON.stringify(getPipelineBoard(), null, 2)}\n`);
  });

  pipeline
    .command("move")
    .argument("<candidate-id>")
    .argument("<status>")
    .option("--approve", "explicit human approval for contact step")
    .option("--next-action <text>", "next action", "Update candidate progress")
    .action((candidateId, status, options) => {
      const result = movePipeline(candidateId, status as PipelineStatus, options.nextAction, Boolean(options.approve));
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  const policy = program.command("policy").description("Policy commands");

  policy.command("view").action(() => {
    process.stdout.write(`${JSON.stringify(getPolicyView(), null, 2)}\n`);
  });

  policy
    .command("update")
    .requiredOption("--weights <json>")
    .action((opts) => {
      const weights = JSON.parse(opts.weights);
      const updated = updateRubricWeights(weights);
      process.stdout.write(`${JSON.stringify(updated, null, 2)}\n`);
    });

  const dashboard = program.command("dashboard").description("Dashboard commands");

  dashboard.action(() => {
    startDashboard();
    dashboardRunning = true;
  });

  dashboard.command("stop").action(() => {
    stopDashboard();
    dashboardRunning = false;
    process.stdout.write("Dashboard stopped.\n");
  });

  dashboard.command("status").action(() => {
    process.stdout.write(`${dashboardRunning ? "running" : "stopped"}\n`);
  });

  program
    .command("request")
    .argument("<goal>")
    .description("Create a request manually")
    .action((goal) => {
      const result = createSearchRequest(goal);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  program
    .command("feedback")
    .argument("<request-id>")
    .argument("<feedback-text>")
    .action((requestId, feedbackText) => {
      const result = addFeedback(requestId, feedbackText);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  program
    .command("seed-candidate")
    .requiredOption("--request-id <id>")
    .requiredOption("--type <agent|human>")
    .requiredOption("--name <name>")
    .option("--source <source>", "candidate source", "other")
    .action((opts) => {
      const result = addCandidate({
        requestId: opts.requestId,
        type: opts.type,
        name: opts.name,
        source: opts.source,
        summary: "Manually seeded",
        skills: [],
        signals: [],
        risks: [],
      });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  program.command("requests").action(() => {
    process.stdout.write(`${JSON.stringify(listSearchRequests(), null, 2)}\n`);
  });

  return program;
}
