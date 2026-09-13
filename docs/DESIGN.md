# Design

Working title: **Ten Digits** (the path). The project needs a name; see
[Open questions](#open-questions).

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

None of this is shown before you choose. The only tell is that the tendency
button is rendered 1.5% larger and one step warmer. Players pick it and report
having chosen freely.

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

Things I decided provisionally and would rather you ruled on:

1. **Moment agency is currently exactly 0%.** Pressing "Dial" at 23:41, in a life
   otherwise lived on autopilot, never works. Thematically perfect; as *game
   feel* it risks reading as a cutscene. I would argue for tuning it to a 3–8%
   sliver, so it is *nearly* never rather than provably never. Your call.
2. **Roll dominance hits 100% at the extremes** — some openings always make the
   call, some never do. Correct by the thesis, possibly airless as play.
3. **10 minutes is probably too short for run 1.** The first life has to teach
   the receipt, the wall, and the rewind. I would budget ~15 minutes for run 1
   and expect 6–8 once the player has the vocabulary.
4. **Suicide as an anchor act** (on your list) needs real care and has concrete
   App Store / Google Play review implications. It is not in this build, and if
   we do it, it should be late, researched, and reviewed by someone qualified.
5. **The title.** "Meritocracy" is the repo. Candidates: *Deserved*, *Tendency*,
   *Ten Digits*, *The Part You Did Not Do*.
