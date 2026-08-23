---
name: review
description: Use before you accept a change, to look at the actual diff with fresh eyes against the original goal and catch what's risky, half-done, or off-scope. Trigger when the user says "/review", "is this good", "should I accept this", "look this over", or before merging/committing a batch of work.
---

# /review — fresh eyes before you accept

The AI wrote it, so the AI is the worst judge of it. This skill is the second pair of eyes a
vibe-coder doesn't have. **Read what actually changed, against what you actually wanted, before
it lands.**

## How to review
1. **Get the diff.** Look at what actually changed (the real edits), not a summary of what was
   intended. Summaries hide bugs; diffs don't.
2. **Hold it against the goal.** Open `CLAUDE.md` and the step's goal. Does this change do that
   thing, all of it, and only it?
3. **Run the checklist:**
   - **Does it do the job?** The actual asked-for behavior, not a near-miss.
   - **Anything risky?** Secrets or API keys in the code, passwords stored as plain text, data
     that could be deleted, anything a stranger could abuse. Flag these first, loudest.
   - **Anything half-done?** A path that errors, a TODO left in, a case that silently fails.
     Every error should be visible, not swallowed.
   - **Did it sneak in scope?** Files or changes nobody asked for. Call them out.
4. **Sort the findings.** Split into **must-fix** (bugs, risks, half-done) and **later**
   (style, polish). Fix the must-fixes now. For anything that's a judgment call, ask, don't
   decide it silently.
5. **Hand the decision back.** Summarize what's solid, what you fixed, and what's left, in
   plain English. **You recommend, they accept.** Never rubber-stamp.

## Red flags, stop and correct

| You're about to... | Don't. Instead... |
| --- | --- |
| Say "looks good" without reading the diff | Read the actual changes, line by line. |
| Polish formatting while ignoring a real bug | Bugs and risks first, style last. |
| Auto-accept a judgment call | Surface it, let them decide. |
| Miss a secret/key/password in the code | Scan for those first, every time. |

## Voice
Honest, specific, no performative praise. "This stores the password in plain text, line 14,
that has to change" beats "looks great!" The point is to catch what they can't.
