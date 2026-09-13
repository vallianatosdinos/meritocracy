# Data model

Defined in [`src/engine/types.ts`](../src/engine/types.ts),
[`scales.ts`](../src/engine/scales.ts) and [`traits.ts`](../src/engine/traits.ts).
The engine is pure TypeScript with no DOM imports, so it runs headless in the
validator and can be ported to another shell without rewriting the game.

## 1. `CausalScale` — the spine

```ts
evolution → culture → ancestry → genes → prenatal → infancy → childhood →
adolescence → years → months → weeks → days → hours → minutes → seconds
```

This is Sapolsky's ladder, and it is the primary axis of the whole model. Every
factor is stamped with a rung. Every receipt is sorted by rung. The receipt
therefore reads as the argument itself, from "four generations up" down to "her
thumb is already moving".

**The wall** is at `childhood`. Childhood and adolescence are on the *playable*
side deliberately: you can rewind to the seven-year-old under the desk, and the
resistance there is so far beyond any budget she will ever have that you will
fail anyway. A locked door teaches less than an unlocked one you cannot walk
through.

## 2. `Factor` — the atom

A factor is one fact about her history. Not a stat, not an event: **a fact that
argues**.

```ts
{
  id: 'f.four-hours',
  scale: 'days',
  label: 'Four hours and ten minutes',     // the receipt line
  detail: 'Sleep deprivation hits the prefrontal cortex first…',
  tags: ['sleep-debt'],                    // how forks find it
  traitDeltas: { impulseControl: -12, stressLoad: 8 },
  resourceDeltas: { sleepDebt: 18 },
  locked: false,
  sourceForkId: 'bedtime',                 // the rewind target
}
```

Factors come from two places: the opening roll (always `locked`) and the option
the player took at a fork.

## 3. `TraitSheet` — stats that remember where they came from

Eight traits, 0–100. Each carries a **provenance ledger**: every factor that
moved it, by how much, at which rung, from which fork.

This exists because *a stat block is a bad argument*. "She has low Impulse
Control" explains nothing and sounds like a character flaw. So a trait never
appears on a receipt as itself — `decomposeTrait()` splits its pull back across
its provenance, and the receipt names a bedtime, a shift, a thrown plate and a
coin flip before birth instead.

There is deliberately **no willpower or virtue stat**. A willpower stat tells the
player she could have tried harder.

## 4. `Weighing` — how a fork converts history into a leaning

```ts
weighing: {
  base: -11,                        // the pull of the moment itself, at 'seconds'
  baseLabel: 'Her thumb is already moving toward the lock button',
  traitTerms: [ { trait: 'threatSensitivity', coef: -26, label: '…' } ],
  tagTerms:   [ { tag: 'slept', coef: 7 }, { tag: 'drink', coef: -9 } ],
}
```

Signed: **positive pulls toward `options[0]`**. Sum them and you have the
leaning. That is all that is going on, and an engine test asserts that the rows
on the receipt sum exactly to it. The game never hides a term; it just never
shows you one in advance.

## 5. `Fork`

```ts
{ id, scale, when, prose, options: [A, B], weighing, anchor?, aside? }
```

Each `ForkOption` carries `label`, `narration`, `confabulation`, and whatever it
`grants`.

`confabulation` is the first-person justification used **when the character does
this while the player pressed the other one**. Every option needs one, including
the "good" ones — being overridden into doing the right thing is just as
unchosen.

## 6. `LifePath`

`roll` (the unchosen) + `baselineTraits` + `forks` + `epilogue`. One file, one
argument.

## Authoring conventions (enforced by `npm run validate`)

1. **`options[0]` is always the effortful branch** — the one that costs
   something, reaches outward, or overrides a habit. `options[1]` is what the
   body does on its own. The validator's strategies depend on this.
2. **Exactly one fork has `anchor: true`.**
3. **Every non-anchor fork must contribute something the anchor weighs.** A scene
   that never appears on the final receipt is decoration, and decoration is what
   makes generated content feel like slop.
4. **Scales descend.** Coarse first, `seconds` last.
5. **Every tag the anchor weighs must be grantable by something.**
6. **Factor and fork ids are unique.**

### Two hazards found while authoring the first path

- **Tag terms multiply.** A `tagTerm` applies its coefficient *once per matching
  factor*. Two facts tagged `meritocratic-wound` at a −12 term is −24, not −12.
  This is correct — they are two separate causes — but it is easy to write by
  accident. Check the receipt.
- **A shared tag is not a shared label.** Receipt rows always name the concrete
  fact; the `tagTerm.label` is rendered as a small qualifier beside it. Two facts
  with one tag must read as two causes, not one duplicated row.

## What the model does not have yet

- **Ancestral rewind** — going back past `prenatal` to play an ancestor. The data
  model supports the scales; there is no mechanic.
- **Cross-run persistence** — the narrator's drift from "you" to "she", and the
  late reveal that the hindsight budget was itself set by the roll.
- **Button choreography** — see `Intent.performance`, which is the seam.
