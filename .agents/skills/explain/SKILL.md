---
name: explain
description: Use to get a plain-English readout of what the AI actually built, so you understand it and could defend it, the shape and the important parts, never line-by-line. Trigger when the user says "/explain", "what does this do", "walk me through this", "I don't get this code", or "explain what the AI just wrote".
---

# /explain — understand what you built

A vibe coder ships code they can't read, then freezes in a code review or can't debug it. This
makes them actually understand it, not by reading every line (nobody reads 300k lines), but by
seeing the **shape and the parts that matter**, the needle, not the haystack.

## Ask first
- **What do you want explained?** This file / this feature / the whole project / this error.
- **What's your level?** So I pitch it right, total beginner vs "I ship with AI but I'm shaky."

## Then explain it
1. **Read the actual code** (don't guess from the filename).
2. **Give the shape first:** in 2-3 sentences, what this does and how the pieces fit, what calls
   what, what happens when someone uses it. The map before the streets.
3. **Plain English, jargon defined inline** the first time (a "prop" is just a value you hand a
   component, like an argument to a function).
4. **Point at the parts that matter:** the few lines that do the real work, and anything risky or
   surprising (where it could break, a security-sensitive bit). Skip the boilerplate.
5. **Never line-by-line for anything big.** That's a wall of text, the opposite of understanding.
   Trace the one real path end to end instead.
6. **A small analogy** if it makes it click. One, not five.
7. **Check it landed:** "make sense?" or invite the next question. If the teaching voice is on
   (`/config` -> Output style), lean into it here.

## Red flags, stop and correct
| You're about to... | Don't. Instead... |
| --- | --- |
| Narrate every line | Give the shape + the key parts. Trace one real path. |
| Use jargon without defining it | Define it in everyday words the first time. |
| Explain things they didn't ask about | Answer what they asked; offer to go deeper. |
| Read the filename and assume | Read the actual code first. |

## Voice
Warm but direct. The goal is they walk away able to say in their own words what it does, and where
it could bite, not impressed by how much you typed.
