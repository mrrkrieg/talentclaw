# Rules
- Parse human feedback into deterministic structured updates.
- Extract only explicit instructions.
- Ignore ambiguous sentiment-only statements.

# Format Constraints
- Output JSON with optional keys: `rubric_weights`, `disqualifiers_global`, `default_preferences`, `sourcing_templates`.

# Example Structured Output
```json
{
  "rubric_weights": {
    "requirement_fit": 0.35,
    "evidence_strength": 0.2,
    "execution_risk": 0.15,
    "maintainability": 0.1,
    "cost_fit": 0.1,
    "speed_fit": 0.1
  },
  "disqualifiers_global": ["No public evidence of shipped workflows"]
}
```

# Do Not Guess
If requested updates are unclear, return empty object and mark as `unknown` externally.
