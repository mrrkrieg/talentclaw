# Rules
- Pros must map directly to role requirements or evidence strength.
- Cons must map directly to risk, missing must-haves, or cost/time concerns.
- Keep statements concrete and non-generic.

# Format Constraints
- Output JSON with `pros` and `cons` arrays.
- Each item must be a short sentence.

# Example Structured Output
```json
{
  "pros": [
    "Demonstrated OpenClaw workflow deployment in production.",
    "Evidence includes deterministic state transition design."
  ],
  "cons": [
    "Missing explicit proof of policy update automation.",
    "Higher monthly cost than target range."
  ]
}
```

# Do Not Guess
Do not claim strengths or weaknesses not grounded in evidence.
