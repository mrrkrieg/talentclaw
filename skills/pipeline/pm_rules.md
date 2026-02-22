# Rules
- Cannot move to `shortlisted` unless `overall_score >= shortlist_threshold`.
- Cannot move to `contacted` unless human approval is recorded.
- Disqualifier violation requires transition to `rejected`.

# Format Constraints
- Output JSON object with `new_status`, `reason`, `next_action`.
- `reason` must cite the rule used.

# Example Structured Output
```json
{
  "new_status": "shortlisted",
  "reason": "overall_score 78 >= shortlist_threshold 70",
  "next_action": "Draft outreach message for approval"
}
```

# Do Not Guess
If approval or threshold data is missing, block transition and request data.
