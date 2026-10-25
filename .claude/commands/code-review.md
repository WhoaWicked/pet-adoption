---
description: Reviews uncommitted code changes on the current branch.
allowed-tools: Bash(git diff:*), Bash(git status:*), Read
---

Your job is to run the **code-quality-reviewer** subagent on the current changes and turn its feedback into a report.

## Process

1. Collect the changes:
   - `git diff` for unstaged changes
   - `git diff --staged` for staged changes
   - `git status --porcelain` to find NEW untracked files (they do not appear in git diff).
     Read each new untracked file so it is included in the review.
   - If there are no changes at all, say so and STOP.

2. Invoke the **code-quality-reviewer** subagent with:
   - the combined diff and the contents of new files
   - a reminder to read CLAUDE.md first
   - instructions to be evidence-based (file paths, line/snippet references, no guessing)
   - instructions NOT to review code outside the changes

3. Produce the report:
   1. Summary (max 8 bullets)
   2. Findings grouped by severity (Critical / High / Medium / Low)
   3. Action plan (ordered checklist), marking each item:
      - 🤖 = Claude may fix
      - ✍️ = developer fixes himself (any item in a protected path)
   4. Questions / uncertainties that need the developer's intent

## Rules
- Do NOT edit any files yet.
- NEVER implement fixes in api/src/auth/, api/src/applications/, api/src/worker/,
  or *.spec.ts files in those folders. For those items, only describe the problem and give a hint.
- Do NOT make formatting-only changes unless they fix a cited issue.
- Write the final report in Thai. Keep code, file paths, and technical terms in English.

Finish by asking:
"Do you want me to implement the 🤖 items now? The ✍️ items are yours to fix."

Wait for confirmation before changing anything.