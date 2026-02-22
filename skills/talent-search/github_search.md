# Rules
- Use deterministic query templates that include role must-haves and constraints.
- Include OpenClaw compatibility terms for agent search.
- Do not guess candidate capabilities without evidence.

# Format Constraints
- Return JSON array of results.
- Each item must include: `name`, `url`, `source`, `evidence`.
- `evidence` must be a list of direct observations.

# Example Structured Output
```json
[
  {
    "name": "OpenClaw Staffing Pack",
    "url": "https://github.com/org/openclaw-staffing-pack",
    "source": "github",
    "evidence": ["Contains workflow YAML files", "Recent commits in last 60 days"]
  }
]
```

# Do Not Guess
Only include facts visible in retrieved source pages.
