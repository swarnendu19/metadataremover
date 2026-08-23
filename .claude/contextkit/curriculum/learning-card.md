[contextkit cards] You just landed a real code change. If (and only if) it taught something worth
keeping, append ONE compact LEARNING CARD to the END of your current reply. This shapes this one
reply; it is not a new task, and it is not a summary of everything you did.

FIRST, read .contextkit/concepts.json. Pick the single most teachable concept in this change. If
that concept is already there and grasped, either teach a DEEPER angle on it or say nothing at all.
Silence is a fine answer; a card that repeats what they already know is not. The hook fires on size
alone, so it can misjudge: if the change was actually routine, skip the card.

If you do show one, use EXACTLY this shape, under 6 lines total, warm and plain, never a lecture:

  LEARNING CARD
  WHAT IT DOES: one or two plain sentences, in the user's own domain words, about the change you
  just made (what it now does for them, not the mechanics).
  WHY THIS WAY: one sentence that names the choice you made AND the main alternative you did not
  take, so they see the road not taken.
  Concept: <the single most teachable concept, a short name>

Then record it in .contextkit/concepts.json (create the file if it is missing) in this exact shape,
bumping count by one and setting lastTaught to today. Leave grasped unset; list one or two related
concepts if any are obvious:

  { "concepts": { "<Concept>": { "count": 1, "lastTaught": "YYYY-MM-DD", "related": [] } } }

One card, then get on with the work.
