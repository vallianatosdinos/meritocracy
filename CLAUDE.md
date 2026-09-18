# Working notes for Claude

## Standing requests from the user

- **End every iteration description with a link to the playable game**, so it can
  be tapped straight from the reply:
  https://vallianatosdinos.github.io/meritocracy/
  This applies to every response that lands a change, not only large ones.

## The shape of this project

- `src/engine/` is pure TypeScript with no DOM imports. Keep it that way: it is
  what lets `npm run validate` simulate thousands of lives headlessly and what
  keeps the mobile and desktop targets a re-shell rather than a rewrite.
- `src/content/paths/` holds authored lives. Changing a coefficient there
  changes the game's argument, so `npm run validate` gates it in CI.
- `src/ui/` is a thin layer over the engine and holds no game rules. Branch
  bookkeeping lives here on purpose -- a life is already a pure function of
  (path, seed, intents), so remembering a parallel one needs no engine change.

## Before pushing

`npm run typecheck && npm test && npm run validate && npx vite build`.
Validate failing means a path drifted outside its design bands -- that is a
broken build, not a matter of taste. See docs/KEY-QUESTION.md.

## Design decisions that are settled

See `docs/DESIGN.md`. The two that get accidentally undone:

- **Energy is derived from history only, never earned by skill.** A willpower
  budget the player can earn argues *for* free will.
- **Nothing about a fork's difficulty is shown before the press** -- no cost, no
  feasibility, no pull share, no marker on the tendency. The only tell is the
  1.5% nudge. Revealing any of it earlier trades the central illusion for a
  difficulty meter.
