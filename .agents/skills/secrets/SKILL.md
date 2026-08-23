---
name: secrets
description: Use before anything goes public or gets deployed, to catch leaked API keys, exposed .env files, plain-text passwords, secrets in frontend code, and the obvious security holes. Trigger when the user says "/secrets", "is this safe to ship", "did I leak a key", "security check", or before /ship.
---

# /secrets — safe to ship?

The fastest way a vibe coder gets burned: a real API key in a public repo, or a `.env` committed,
or a secret key shipped in the frontend where anyone can read it. This is the pre-public check.
Public is forever, scanning AFTER it's out is too late, so this runs before /ship.

## Ask first
- **Is this about to go public or deploy?** (A public GitHub repo or a live site.)
- **What does it handle?** Logins, payments, user data, anything sensitive raises the bar.

## Check these (report findings in plain English, worst first)
1. **Leaked secrets in the code:** API keys, tokens, passwords sitting in source. Grep for the
   usual shapes (`sk-`, `AKIA`, `AIza`, `ghp_`, `xox`, `-----BEGIN`, `password =`, `secret =`).
2. **Secrets in git history, not just current files.** A key you deleted is still in old commits.
   `git log -p` / search history. If one's in history, it must be rotated, deletion isn't enough.
3. **`.env` exposure:** is `.env` in `.gitignore`? Was it ever committed? Is `.env.example` clean
   (no real values)?
4. **Secrets in frontend/client code:** a secret/service key in React/Next client code ships to
   every visitor. Only "public"/publishable keys belong there.
5. **Plain-text passwords:** user passwords stored unhashed. They must be hashed.
6. **Wide-open routes:** sensitive endpoints with no auth check; user input dropped straight into
   SQL/shell; CORS set to `*` on something private.

## Then
- List what you found, ranked, each with the fix in one line.
- If a key was ever public or committed: tell them to **rotate it** (make a new one, revoke the
  old), not just delete it. A leaked key is compromised the moment it's pushed.
- Green-light only when the real risks are handled. Then `/ship`.

## Red flags, stop and correct
| You're about to... | Don't. Instead... |
| --- | --- |
| Only scan current files | Check git history too, secrets hide in old commits. |
| Say "delete the key, you're fine" | Rotate it. Deletion doesn't un-leak it. |
| Wave through a secret in client code | That ships to every visitor. Move it server-side. |
| Call it safe without checking auth | Check that sensitive routes actually require login. |

## Voice
Serious and direct, this is the one place "probably fine" gets someone hurt. Plain about the risk
and the fix, no fear-mongering.
