# Rules
- Extract only explicitly stated skills and signals.
- Mark unverified skills as `unknown`.
- Risks must map to missing evidence or clear red flags.

# Format Constraints
- Return one JSON object per candidate.
- Required keys: `summary`, `skills`, `signals`, `risks`, `unknowns`.

# Example Structured Output
```json
{
  "summary": "OpenClaw-focused contributor with workflow packaging examples.",
  "skills": ["openclaw", "workflow orchestration"],
  "signals": ["Published reusable pack", "Maintains public repo"],
  "risks": ["No documented production SLA ownership"],
  "unknowns": ["budget expectations"]
}
```

# Do Not Guess
If evidence is absent, use `unknowns` and do not infer.
