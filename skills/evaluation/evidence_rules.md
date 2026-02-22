# Rules
- Every score explanation must reference at least one evidence point.
- Unknown evidence must lower confidence and be stated explicitly.
- Prefer direct artifacts (repos, docs, deployments) over claims.

# Format Constraints
- Provide `evidence_map` keyed by rubric dimension.
- Include `confidence` from 0.0 to 1.0.

# Example Structured Output
```json
{
  "evidence_map": {
    "requirement_fit": ["Repo includes OpenClaw YAML workflows"],
    "evidence_strength": ["Recent merged PRs demonstrate maintenance"]
  },
  "confidence": 0.78
}
```

# Do Not Guess
If no direct evidence exists, report `unknown` and reduce confidence.
