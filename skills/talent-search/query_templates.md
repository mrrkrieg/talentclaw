# Rules
- Build deterministic queries from must-haves and constraints.
- Agent queries first; human queries second.
- Add stack constraints and region constraints when provided.

# Format Constraints
- Return JSON object with `agent_queries` and `human_queries`.
- Each query must be a complete string with no placeholders.

# Example Structured Output
```json
{
  "agent_queries": [
    "OpenClaw workflow pack sqlite deterministic scoring"
  ],
  "human_queries": [
    "OpenClaw Workflow Engineer sqlite rubric evaluation"
  ]
}
```

# Do Not Guess
Do not inject constraints that were not provided in intake.
