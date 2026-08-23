---
name: ship
description: Use to get the project LIVE on the internet, deploy it, set production env vars, and hand back a working URL. Trigger when the user says "/ship", "deploy", "put it online", "make it live", "go live", "host it", or "how do people see this".
---

# /ship — get it live

Putting their thing on the internet is the moment a vibe coder has been waiting for, and the
thing they most often can't do alone. Make it happen cleanly, and make sure it actually works
live, not just "deployed."

## Ask first
- **Where should it live?** Default to **Vercel** for anything React/Next, **Netlify** for a
  static site. If they don't know, recommend Vercel and move on.
- **Is it in git and pushed to GitHub yet?** Hosts deploy from a repo. If it's not pushed, do
  that first (commit, create the repo, push).
- **What does it need to run in production?** API keys, database URLs, any `.env` values, those
  must be set on the host, not committed.

## Do it
1. **Safety gate.** Run `/secrets` first. Never ship a leaked key or a committed `.env`.
2. **Commit and push** the working state to GitHub (deploys come from there).
3. **Connect the repo to the host** (Vercel/Netlify import, or `vercel` CLI). Let it auto-detect
   the framework.
4. **Set the production env vars on the host** (the ones from step "ask first"). This is the #1
   reason a deploy works locally but breaks live, the prod env isn't set.
5. **Deploy**, and get the URL.
6. **Prove it's actually live (Rule: prove it).** Open the URL yourself, do the real thing (load
   the page, submit the form, sign in). "Deployed" is not "working." If it's blank or 500s, it's
   almost always a missing env var or a build error, read the deploy log.
7. **Let the moment land.** Once the URL has actually returned 200, run:

       node .claude/contextkit/bin/celebrate.mjs --url <the-live-url>

   (If that file doesn't exist, this is a global install: run `node ~/.claude/contextkit/bin/celebrate.mjs
   --url <the-live-url>` instead. If neither script path exists, skip this step and just tell them
   the URL is live - never show them an error for a celebration.) This is their thing on the internet
   for the first time, give it a beat before the wrap-up below.

Then hand them the URL plainly: "It's live at X. I opened it and Y works."

## Red flags, stop and correct
| You're about to... | Don't. Instead... |
| --- | --- |
| Deploy without running `/secrets` | Check for leaked keys first. Public is forever. |
| Skip setting prod env vars | Set them on the host, or it'll break live. |
| Assume "deployed" means "working" | Open the live URL and test it. |
| Commit a `.env` or a key to push it | Never. Env vars go in the host's settings. |

## Voice
Direct and a little celebratory, this is the payoff. But verify before you say it works.
