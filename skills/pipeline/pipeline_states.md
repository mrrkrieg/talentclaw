# Rules
- Allowed order: sourced -> shortlisted -> contacted -> responded -> screening -> trial -> hired/rejected.
- `rejected` is allowed from any non-terminal state.
- `hired` and `rejected` are terminal.

# Format Constraints
- Transition request must include `candidate_id`, `from`, `to`, `next_action`.
- Return JSON with `valid` and `reason`.

# Example Structured Output
```json
{
  "valid": true,
  "reason": "Transition is one stage forward."
}
```

# Do Not Guess
Do not approve transitions without reading current persisted status.
