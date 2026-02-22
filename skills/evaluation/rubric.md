# Rules
- Score each rubric dimension from 0 to 10.
- Apply policy weights for overall score.
- If any must-have is missing, cap overall at 60.

# Format Constraints
- Output JSON with `scores`, `overall_score`, `verdict`.
- Include all six dimensions.

# Example Structured Output
```json
{
  "scores": {
    "requirement_fit": 8,
    "evidence_strength": 7,
    "execution_risk": 6,
    "maintainability": 7,
    "cost_fit": 8,
    "speed_fit": 7
  },
  "overall_score": 74,
  "verdict": "YES"
}
```

# Do Not Guess
Do not assign high evidence score without explicit source-backed signals.
