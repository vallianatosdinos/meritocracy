# How do we generate life paths that are meaningful?

Your key question. Here is a concrete answer, plus the tooling that makes it
checkable rather than a matter of taste.

## The reframe

"Meaningful" as a feeling is not tractable. But it decomposes into four
properties that *are* measurable, and once they are measurable you can generate
against them:

A path is meaningful when it is simultaneously

1. **an argument** — the player's in-the-moment press barely moves the anchor act;
2. **a game** — playing the whole life *does* move it, materially;
3. **not a lecture** — the opening roll, which the player never touches,
   dominates both;
4. **well-built** — every scene plants at least one factor the anchor actually
   weighs.

`npm run validate` measures all four against declared bands and exits non-zero
when a path falls outside them.

```
[design bands]
  PASS  moment agency   (anchor press only)     0.0%  target 0.0%-15.0%
  PASS  lifetime agency (whole life played)    50.0%  target 18.0%-55.0%
  PASS  roll dominance  (unchosen origins)    100.0%  target 20.0%-100.0%
  PASS  confabulation rate                    35.9%  target  8.0%-45.0%
```

These bands are the design spec. They are the thing to argue about — arguing
about the prose is arguing about a symptom.

**This already did work.** The first draft of `Ten Digits` scored 64% lifetime
agency: the player had too much free will, and nobody reading the script would
have noticed. Two tuning passes brought it to 50%.

## Write backwards from the act

Do not generate a life and see what it produces. Generate **the conclusion
first**, then the premises that force it.

**1. Pick the anchor act and the target distribution.**
Not "she doesn't call" — *"she calls in 15–45% of lives, and in 40%+ of lives it
is not available at any price."* The act is the thesis; the distribution is the
spec.

**2. Derive the factor budget.**
To lean the anchor by ~X, you need contributions summing to ~X, spread across
the ladder with required coverage: at least one factor at `genes`/`prenatal`, one
in `childhood`, one cultural, one at `hours`, one at `seconds`. The spread is
what makes it Sapolsky rather than a stat check. This is a constraint problem, and
constraint problems are exactly what machines are good at.

**3. Draw factors from a typed library.**
Each library entry declares the rung it lives on, the traits it moves, the tags
it carries, and the *kind of scene* that can plant it. This is what makes
generation tractable: the generator assembles typed parts, it does not invent
physics.

**4. Assemble scenes in scale order**, compressing toward the anchor.

**5. Write the prose last**, against a strict slot contract. Prose is the most
swappable layer, not the foundation.

**6. Validate by simulation, and throw away whatever fails.**

## What the LLM does and does not do

This matters more than any other decision here.

| The model may | The model may **not** |
|---|---|
| propose anchor acts | set coefficients or weights |
| select factors from the library, with justification | invent resolution maths |
| write prose into authored slots | decide whether a path is good |
| write `confabulation` lines | ship anything unvalidated |

**The generator proposes; the simulator disposes.** Every generated path runs
4,000 headless lives before a human ever reads it. That is the gate that stops
this becoming an infinite slop machine — and the reason the engine has no DOM
dependency.

An honest caveat: I do not yet know whether a generated path will *read* as well
as a hand-written one, only that it can be made to behave correctly. Structure
is checkable; whether a scene lands is not. Which is why the plan is to hand-craft
path #2 as well, before trying to automate anything.

## Two failure modes with names

**Decoration.** A scene that does not appear on the anchor's receipt. It will
feel like filler because it *is* filler, and this is the dominant failure mode of
generated narrative content. Caught structurally:

```
FAIL  fork "the-lunch" contributes nothing the anchor weighs — it is decoration
```

**The stat check.** A path whose anchor is decided by one or two large terms. It
will read as a skill gate, not as a life. Not yet auto-detected — the obvious
metric is the Gini coefficient of the contribution weights on the anchor receipt,
and it should be low. *Worth adding.*

## Granularity

Answered in [DESIGN.md](./DESIGN.md#granularity--your-other-question). Short
version: scenes are not evenly spaced, time compresses toward the anchor, and the
unit of authoring is the **factor**, not the scene.

## Where this is genuinely unfinished

- The factor library does not exist yet — factors are currently inline in the
  path file. Extracting them is the next real step, and it is the thing that
  makes step 3 above possible.
- Roll dominance hitting 100% means some openings are fully determined. Correct
  by the thesis, possibly airless as play. Needs a second path to know.
- The bands themselves are guesses. They are *falsifiable* guesses, which is the
  point, but they have not been tested against a player.
