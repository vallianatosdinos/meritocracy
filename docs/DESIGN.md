# Design

The game is **Meritocracy**. "Ten Digits" is the first *path* inside it — one
authored life, replayed with a different opening roll each time. Those are
separate things and the distinction matters as soon as there is a second path.

## The thesis, stated once

There is no uncaused chooser. What a person does at any moment is the output of
everything that happened before it — genes, foetal environment, childhood,
culture, hormone levels, blood glucose, how much sleep they got. Given that,
treating outcomes as *deserved* produces hubris in the people who did well and
self-hatred in the people who did not.

Sapolsky supplies the mechanism. Sandel supplies the consequence. The game has
to land both without ever saying either out loud.

## The friction, and how we get around it

You named the real problem: games are choice machines, and we are arguing that
choice is an illusion. A game with no choices is a video.

The resolution is not to remove the choice. It is to **move the player's real
agency out of the moment and into the past**.

> The absence of free will does not mean nothing causes anything. It means the
> causes are all upstream, and none of them are a self.

So the game has two layers, and they teach opposite lessons:

**Layer 1 — the life (the illusion).** Scenes arrive. Each one is a fork with
two options. You press a button. It feels exactly like every choice-based game
you have ever played. Most of the time what you pressed is what happens, because
most of the time you pressed the thing she was going to do anyway.

**Layer 2 — the ledger (the argument).** At any point you can stop being her and
become the person reading her case file. The timeline opens. Every factor that
produced the current leaning is listed, attributed, weighted, and sorted deepest
cause first. Some of those factors point at moments you played, and you can go
back and spend a scarce resource to change them. Most of them point at things
that happened before she was born, and those have a small square next to them
that means *fixed*.

The player's agency is real, and it is entirely retrospective. That is the
argument, delivered as a control scheme.

## The five feelings

From your notebook, and each one is now a mechanical state, not a mood:

| Feeling | Mechanical cause |
|---|---|
| **flow** | Pressing the tendency. Free, instant, no roll. |
| **yeah, whatever** | Most forks lean gently. You barely notice you agreed. |
| **helpless** | `feasibility: 'impossible'` — the button does nothing and the game explains, cheerfully, why. |
| **overwhelmed** | The receipt. Thirty weighted rows, eight of them fixed. *(Partly built — see Roadmap.)* |
| **strain** | `feasibility: 'affordable'` but expensive: you can do it, and it will cost you the rest of the night. |

## Core loop

```
roll  →  scene  →  press  →  resolve  →  [step out → read → rewind]  →  … →  anchor act  →  coda
```

1. **The roll.** Ancestry, family, postcode, body. Revealed one at a time, with
   the narrator's commentary. You cannot re-roll. This is Sandel's hammer and it
   swings before the game starts.
2. **Scenes** descend the causal ladder — childhood, adolescence, years, months,
   weeks, days, hours, minutes — compressing as they approach the anchor.
3. **The anchor act** is the one thing the path exists to explain. Everything
   before it is a premise.
4. **The coda** is identical whether she did it or not. The game refuses to
   reward you, because rewarding you would concede that you earned it.

## Resolution: what actually happens when you press a button

Every fork computes a signed `leaning` from the character's history. The larger
side is the **tendency**; the gap is the **resistance** of the other path.

- Press the tendency → it happens. Free.
- Press the other one → it costs `resistance × 1.45` energy and rolls against a
  success chance derived from resistance.
  - **affordable** — she can try. She might fail anyway.
  - **out of reach** — she tries, empties out, and does the tendency. Trying costs
    the same as succeeding. This is not a bug.
  - **impossible** — nothing happens at all. There is no arrangement of *this*
    life in which that act occurs tonight.

None of this is shown before you choose. The only tell is that the tendency arm
is rendered 1.5% larger and one step warmer. Players pick it and report having
chosen freely.

### Confabulation

When the resolved action differs from what you pressed, the character narrates a
first-person justification for the thing she did instead:

> *She put the phone face down. She has a reason. It is a good reason and she
> believes it completely: it is late, he will be asleep, she will do it properly
> at the weekend when she is not this tired. Every clause of that is true. None
> of it is why.*

This is the split-brain result as a feedback message, and it is the single most
important beat in the game. You watched yourself press a button. She did not.
She has an explanation, and she is not lying.

## One space, three distances

There is no scene screen, no receipt screen and no timeline screen. There is one
canvas holding her whole life, and those three are three distances from it —
*moment*, *around*, *life* — animated and anchored on the fork in question, so
the player can always tell where they went.

**A life is a chain of diamonds.** That shape is not decoration, it is what the
model is: the sequence of forks is fixed, so a choice changes what happens at a
fork, never which fork comes next. Each fork therefore splits and rejoins.

**The receipt lives on the arms.** The engine produces one signed list of
contributions; positive pulls toward one option, negative toward the other. Put
each cause on the arm it pulls toward and a table becomes a picture of a decision
being made — same numbers, same sum.

**A parallel life is a different traversal of the same chain**, drawn in cold
blue against the active path's warm gold. Which gives the four fork states:

| | lived | not lived |
|---|---|---|
| **active** | gold — her past | not drawn |
| **parallel** | blue — a life stepped out of, running on ahead | not drawn |

The road not taken is *literally not there* until you go back and take it. That
is not a rendering shortcut; it is the claim.

**What is never drawn on an undecided fork:** cost, feasibility, pull shares,
which arm is the tendency. All of it appears the instant the press lands and
stays forever after — which is roughly when a person gets to learn what a choice
of theirs cost. Revealing it a moment earlier would replace the central illusion
with a difficulty meter.

## ⚠ The energy mechanic nearly argues the opposite thing

The "burn calories to do the hard thing" idea from your notes has a failure
mode worth stating plainly, because it would quietly sink the whole project:

**A willpower budget the player can earn through skill is an argument *for* free
will.** It says: you could have managed your resources better, therefore you
could have tried harder, therefore the outcome is your fault. That is precisely
the belief we are attacking, re-implemented as a game system.

The fix is a hard rule, enforced in `computeEnergyCap`:

> **Energy is derived from history and from nothing else.** It is never a reward
> for playing well, never granted for skilful input, never a pickup. Sleep,
> stress, food, and the roll set it. That is the entire list.

This keeps the *feeling* you wanted ("you can't keep doing it all the time")
while the *meaning* stays right: she ran out because of what happened to her.
The energy bar even draws its own missing ceiling — the hatched region is the
part she cannot reach tonight, and it was set before you arrived.

## Tone and person

**The narrator addresses you. The character is always in the third person.**

This split is load-bearing. The cynical lines from your notebook — "oops! I guess
you were born in the wrong family!" — are obviously someone talking *to the
player*, not to Nadia. Making that explicit from the first line establishes that
you are not her, which is the thing we are trying to prove.

Register: dry, specific, unsentimental, occasionally cruel to *you* and never to
her. No lecturing. The argument is in the receipt, not the prose.

Planned long-arc device (not yet built): across many runs the narrator's grammar
drifts. Run 1: *"You went to bed."* Run 6: *"She went to bed. You watched."*

## Granularity — your other question

**Scenes are not evenly spaced in time, and the unevenness is the content.**

A path is not a biography. It is a Sapolsky chapter list: the same act
interrogated at every scale, with time compressing as you approach it.
`Ten Digits` spans twenty-four years and ends with four scenes inside thirty
minutes.

The unit of authoring is **not the scene — it is the factor**. A scene exists to
plant a factor that the anchor act actually weighs. The validator enforces this:

```
FAIL  fork "the-lunch" contributes nothing the anchor weighs — it is decoration
```

Working shape, from the first path:

| Rung | Scenes | Job |
|---|---|---|
| childhood | 2 | install the traits that everything else multiplies |
| adolescence | 2 | the strategy that works, and the first sorting |
| years | 2 | the silence, and the meritocratic wound |
| months / weeks | 3 | the situation the anchor sits inside |
| days | 2 | **the cheap levers** — sleep, money |
| hours / minutes | 4 | the body on the day |
| seconds | 1 | the anchor |

The days/hours/minutes/seconds band shares one continuous energy budget. Coarser
rungs each get their own — they are separate occasions, not one long afternoon.
This is why last night's bedtime is still on the books at 23:41, and it is the
mechanism behind "sometimes it's as simple as sleeping earlier".

### Session length (settled)

**~15 minutes for a player's first life, 6–8 minutes for every life after.**

The first run is not just a run: it has to teach the receipt, the wall, and the
rewind, none of which any other game has taught this player. Pricing that as ten
minutes means teaching none of them properly. Later runs compress hard, because
by then the player has the vocabulary and is there for the variation.

Consequence for authoring: a path is sized for the *second* playthrough. The
first one is longer because the player stops to read, not because there is more
of it.

## Content boundaries (settled)

The game is about cruelty done *to* people by circumstance, so it will keep
arriving at hard material. Where the line sits, decided now rather than after
five more paths are written:

**In.** Domestic violence, alcohol, poverty, humiliation, family estrangement,
illness and death — at roughly the register already in `Ten Digits`: specific,
unsentimental, never staged for shock.

**Out. Suicide and self-harm are not available as anchor acts or as scene
content.** It was on the original list and it is the one that does not survive
the thesis: a game whose entire argument is *you could not have done otherwise*
should not put that act in a player's hands, and the mechanics that make every
other anchor land — the tendency nudge, the confabulation, the cheerful narrator
— would all be actively harmful pointed at this one. It is also the single
biggest storefront-rating risk, but that is the lesser reason.

This is a boundary on the *anchor-act library*, not a squeamishness rule: a
character may be in despair, and the game may sit in it. The act the player is
asked to attempt or fail is what is constrained.

## Measured behaviour of the first path

From `npm run validate`, 4,000 seeds per strategy:

| | |
|---|---|
| Drift (always take the tendency) | **0%** make the call |
| Resist only at 23:41 | **0%** |
| Resist at every fork in the life | **50%** |
| Cannot make the call under *any* play | **46%** of lives |
| Spread across opening rolls | **0% → 100%** |
| Moments where the game overrode the player | **36%** |

Read that middle row again: **half of all lives cannot make a phone call.** Not
because the player played badly — because of the roll.

## Open questions

Still genuinely open, and worth a decision before path #2:

1. **Moment agency is currently exactly 0%.** Pressing "Dial" at 23:41, in a life
   otherwise lived on autopilot, never works. Thematically perfect; as *game
   feel* it risks reading as a cutscene. I would argue for tuning it to a 3–8%
   sliver, so it is *nearly* never rather than provably never. Your call.
2. **Roll dominance hits 100% at the extremes** — some openings always make the
   call, some never do. Correct by the thesis, possibly airless as play.

### Settled

- **Title: *Meritocracy*.** "Ten Digits" is path one.
- **Session length: ~15 minutes for a first life, 6–8 after.** See
  [above](#session-length-settled).
- **No suicide or self-harm** as an anchor act or scene content. See
  [Content boundaries](#content-boundaries-settled).
