# Rules
- Every pipeline transition must include a concrete next action.
- Next action must include owner or execution hint.
- Avoid vague text like "follow up later".

# Format Constraints
- Output plain text `next_action` string or JSON with `next_action`.
- Keep under 120 characters.

# Example Structured Output
```json
{
  "next_action": "Owner: PM. Send shortlist package for approval by Friday 17:00."
}
```

# Do Not Guess
Do not assign owners unless owner information exists in context.
