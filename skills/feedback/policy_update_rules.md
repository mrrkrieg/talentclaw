# Rules
- Policy updates must be deterministic and auditable.
- Keep previous policy history in `feedback_events`.
- Weights must sum to 1.0.

# Format Constraints
- Return JSON with `applied`, `changes`, `validation_errors`.
- `changes` must include old and new values.

# Example Structured Output
```json
{
  "applied": true,
  "changes": [
    {
      "field": "rubric_weights.requirement_fit",
      "old": 0.3,
      "new": 0.35
    }
  ],
  "validation_errors": []
}
```

# Do Not Guess
Reject updates that cannot be validated against schema and invariants.
