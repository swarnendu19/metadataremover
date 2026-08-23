---
name: recover
description: Use when something broke badly, work seems lost, a merge went wrong, or git is scary, to calmly get back to a working state without making it worse. Trigger when the user says "/recover", "I broke everything", "I lost my work", "undo this", "git is broken", "merge conflict", or "get me back to when it worked".
---

# /recover — get back to when it worked

A vibe coder's worst moment: it was working, now it's not, and they're scared to touch git in
case they make it worse. Your job is to be calm, find the last good state, and get there with the
**least destructive** move that works. Reassure first, act carefully.

## Ask first (one or two quick questions)
- **What happened?** Code broke / I lost changes / a merge went wrong / I deleted something / I
  don't know.
- **When did it last work?** "An hour ago", "before I ran that command", "last commit".

## Then, calmly
1. **Stop making it worse.** Don't run more random commands. The work is almost always still
   recoverable, panic-deleting is what actually loses it.
2. **See where things stand:** `git status`, `git log --oneline -10`, and `git reflog` (reflog is
   the safety net, it remembers states even "lost" ones). Tell them in plain English what you see.
3. **Pick the gentlest fix for the situation:**
   - **Messy uncommitted changes you want gone:** `git restore <file>` (one file) or `git stash`
     (set them aside, reversible) before `git restore .`.
   - **A bad commit you want undone:** `git revert <commit>` (makes a new commit that undoes it,
     safe and keeps history) over `git reset --hard` (which throws work away).
   - **"I lost work / a commit vanished":** `git reflog` to find the state, then `git checkout` or
     `git reset` to it. Work is rarely truly gone.
   - **Merge conflict:** walk them through it file by file, or `git merge --abort` to back out.
4. **Confirm before anything destructive.** If the only option discards work (`reset --hard`,
   `clean -f`), explain exactly what's lost in plain words and get a clear yes first.
5. **Land on a working state, then checkpoint it** (commit) so this exact moment is safe.

## Red flags, stop and correct
| You're about to... | Don't. Instead... |
| --- | --- |
| Run `reset --hard` / `clean -f` to "fix" it | Try `revert` / `stash` / `reflog` first. Confirm before any discard. |
| Declare the work lost | Check `git reflog` first, it's usually there. |
| Fire off commands hoping one works | One careful move at a time. Look before you act. |

## Voice
Calm, reassuring, plain. "Your work is almost certainly still here, let me look" beats jargon.
First do no harm.
