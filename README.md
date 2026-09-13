# Meritocracy

A game about the absence of free will, and about what believing in merit does to
people who are told they earned their lives.

Massively indebted to Robert Sapolsky's *Behave* and *Determined*, and to
Michael Sandel's *The Tyranny of Merit*.

> Don't let them tell you it's your fault. Don't let them tell you you earned it
> either.

## What exists right now

A playable web prototype of one hand-crafted life. You roll for an origin you do
not choose, live twenty-four years compressed into about ten minutes, and arrive
at 23:41 on a Tuesday, where Nadia either calls her father or does not.

At any point you can step out of her, read the full itemised account of why she
is about to do what she is about to do — sorted from "four generations up" down
to "her thumb is already moving" — and spend a scarce budget to go back and
change one of the causes that is still reachable. Most of them are not.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 — also serves on your LAN for phone testing
npm test             # engine invariants
npm run validate     # simulate 4,000 lives per strategy and check the design bands
```

`npm run dev` binds to `0.0.0.0`, so the printed network URL works on a phone on
the same wifi. Pushing to `main` publishes the prototype to GitHub Pages; see
[GETTING-STARTED.md](docs/GETTING-STARTED.md) if you have not deployed anything
before.

## Docs

| | |
|---|---|
| [GETTING-STARTED.md](docs/GETTING-STARTED.md) | running it, testing on a phone, publishing a playtest link, how to run a playtest |
| [DESIGN.md](docs/DESIGN.md) | pillars, the two layers, how the choice/no-choice friction is resolved, tone, open questions |
| [DATA-MODEL.md](docs/DATA-MODEL.md) | the schema and the authoring rules |
| [KEY-QUESTION.md](docs/KEY-QUESTION.md) | how to generate life paths that are meaningful, and how to prove one is |
| [ROADMAP.md](docs/ROADMAP.md) | what is next, what is deliberately missing, platform plan |

## Layout

```
src/engine/    pure TypeScript, no DOM — the whole game is here
src/content/   life paths. ten-digits.ts is the one hand-crafted path
src/ui/        React shell: scenes, receipt, observer mode
scripts/       validate.ts — the headless simulator that gates path quality
```

The engine has no DOM dependency on purpose: it runs headless in the validator,
and the mobile (Capacitor), desktop (Tauri) and Steam targets reuse it unchanged.
