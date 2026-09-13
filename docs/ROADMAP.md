# Roadmap

## Your plan, and where it stands

| Step | Status |
|---|---|
| Hand-craft a life path (AI-assisted, you review) | **Done, needs your review** — `src/content/paths/ten-digits.ts` |
| Define the data model before prototyping | **Done** — [DATA-MODEL.md](./DATA-MODEL.md) |
| Prototype navigation with budget as the only player-modifiable parameter | **Done** — playable, `npm run dev` |
| Prototype the button choreography | **Not started** — seam is `Intent.performance` |
| Hand-craft a second path | **Not started** — the real test of the abstraction |
| Answer the key question | **Method + tooling done**, [KEY-QUESTION.md](./KEY-QUESTION.md); unproven until path #2 |

## Next, in the order I would do it

1. **You read `ten-digits.ts` and tear it apart.** It is the abstraction level
   made concrete; everything downstream inherits its assumptions.
2. **Settle the open questions** in [DESIGN.md](./DESIGN.md#open-questions) —
   especially whether moment agency should be 0% or a 3–8% sliver.
3. **Extract the factor library** out of the path file. This is the precondition
   for generating anything.
4. **Path #2, hand-crafted, different anchor act.** Suggest one of: *saying no to
   a relative who needs money*, *the vote*, or *ignoring someone on the street* —
   each stresses a different part of the model. This is where we find out whether
   the data model generalises or whether it was shaped around one story.
5. **Button choreography.** Only after two paths exist, because its difficulty
   curve has to be tuned against real resistance distributions.
6. **Then** attempt generation.

## Deliberately not built yet

- **Ancestral rewind** — the notebook's most beautiful idea and its most
  expensive. Rewinding past `prenatal` into an ancestor's life. The scale ladder
  supports it; there is no mechanic. Currently those factors are shown, marked
  fixed, and that is all.
- **Cross-run persistence** — the narrator drifting from "you" to "she" across
  runs, and the late reveal that the hindsight budget was set by the opening roll.
- **Audio.** This game is 60% audio and there is none.

## Platform plan

The engine is pure TypeScript with no DOM dependency; the UI is a thin React
shell over it. That is the whole portability strategy.

| Target | Route | Notes |
|---|---|---|
| Web | Vite build | works now; `base: './'` is already set for embedding |
| iOS / Android | **Capacitor** | wraps the same build; App Store and Play both accept it |
| Windows / macOS | **Tauri** | much smaller than Electron, and Steam accepts it |
| Steam | Tauri + `steamworks` | fine for a text/UI game |

Nothing platform-specific has been added yet, deliberately — it is easy later and
it is dead weight now. The one real constraint being respected already: **no
DOM, timing, or browser API in `src/engine`.**

Two things worth knowing early about store distribution:

- **Content rating.** Domestic violence, alcohol, and (if we go there) suicide
  drive IARC ratings and can affect storefront placement. Worth deciding the
  ceiling before writing more paths, not after.
- **Apple requires a privacy manifest** even for a game that collects nothing.
  Trivial, but it has blocked releases.
