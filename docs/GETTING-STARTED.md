# Getting started: publishing and playtesting

Written for a workflow with **no local setup at all** — the Claude app for
changes, github.com for everything else, a phone browser for playing. You never
need a terminal, and you never need the code on your machine.

**The order that matters:** get it on a URL → open that URL on your phone → put
it in front of five people → *then* think about stores. Stores are the last 5% of
the work and the first thing everybody wants to do. Skip them for now; there is a
section at the end about why.

---

## 1. The loop

```
you ask Claude for a change
        ↓
Claude edits the code and pushes it to GitHub
        ↓
CI runs automatically   →  typecheck, engine tests, path validation, build
        ↓
Pages deploys automatically  (~2 min)
        ↓
you refresh the URL on your phone
```

Nothing in that diagram needs a computer of yours. The whole thing happens on
GitHub's machines.

**CI is the part that protects you.** Every push runs `npm run validate`, which
simulates thousands of lives and **fails the build if a path drifts outside its
design bands**. If a coefficient tweak accidentally hands the player too much
free will, the Actions tab goes red before anyone plays it. You do not have to
remember the thesis; the build remembers it.

## 2. One-time setup, then a public URL

Two settings on github.com. You only ever do this once.

**A. Turn Pages on**

> Repo → **Settings** → **Pages** → under *Build and deployment*, set
> **Source: GitHub Actions**

**B. Let working branches publish**

> Repo → **Settings** → **Environments** → **github-pages** →
> *Deployment branches* → **No restriction**

Without B, only `main` can publish and a branch deploy fails with *"Branch is not
allowed to deploy to github-pages due to environment protection rules"*. With it,
anything Claude pushes goes live on its own.

Your URL, from then on:

```
https://vallianatosdinos.github.io/meritocracy/
```

First deploy takes a couple of minutes, later ones about one. Watch it in the
**Actions** tab — a green tick means it is live. A red X: click into the run, and
the step that failed names itself. Paste it to Claude.

### Publishing on demand

If you ever want to publish something manually — a specific branch, or a re-run
after changing a setting:

> **Actions** tab → *Deploy prototype* → **Run workflow** → pick the branch

### Seeing a change on your phone

Open the URL, then **pull down to refresh**. Mobile browsers cache aggressively;
if you are staring at an old build, close the tab and reopen it, or add `?v=2` to
the end of the URL.

---

## 3. Playtesting

You need **five people, individually, in the same room as you.** Not a group. Not
a survey. Five is not a rule of thumb I made up — past about five you stop
learning new things per person and start hearing the same problems again.

### The method

1. **Say almost nothing.** "This is a prototype, about ten minutes. Think out
   loud — say what you are noticing, what you expect to happen, what confuses
   you." Then stop talking.
2. **Never explain. Never defend.** The hardest part. When they misread
   something, that is the finding. If you explain it, you have destroyed the
   data and learned nothing. Write it down and stay quiet.
3. **Watch the hands and the face, not the screen.** Hesitation before a tap,
   scrolling back up, a frown, putting the phone down — those are your signal.
4. **The only questions, and only at the end:**
   - *What was that about?* (do they have the thesis, without being told?)
   - *Was there a moment you felt you were really choosing?*
   - *Was there a moment you felt you had no choice?*
   - *Did anything feel broken?*
5. **Their explanations are worth less than their behaviour.** People are
   unreliable narrators of their own play — which, given what this game is
   about, is either a problem or the most on-brand sentence in this document.

### What to watch for in *this* game specifically

Five things carry real risk. Score each session against them.

**1. Does confabulation read as a bug?** ⚠ *The biggest risk in the whole design.*
When the game does something other than what they pressed, do they think "oh,
she couldn't" — or "this game is broken"? If more than one or two people say
broken, the beat needs stronger signposting before it needs rewriting.

**2. Does anyone press "Step out and look at why"?** If nobody discovers it, the
entire second layer — the actual argument — does not exist. Count discoveries. If
it is under three in five, the button needs to be louder or the game needs to
force it once.

**3. Does the receipt land or drown them?** Watch for the scroll-and-glaze. Do
they read rows, or scan and leave? Do they ever tap "go back to this"?

**4. Do they notice the lean?** They should *pick* the tendency without
consciously *seeing* that it is nudged. If someone says "the second button looked
bigger", the CSS is too loud. If everyone insists they chose completely freely
while picking the tendency 80% of the time, it is exactly right.

**5. Does the coda land or preach?** The last screen refuses to reward them. Do
they sit with it, or roll their eyes? An eye-roll means the prose is doing work
the mechanics should have already done.

### Where it will probably break first

My honest guesses, so you can check them rather than trust them:

- the first two childhood scenes are slow before the player knows why they matter;
- ten minutes is optimistic for a first run — budget fifteen;
- "energy" is unexplained until it stops you, which may read as arbitrary;
- nobody steps out unprompted.

### Writing it down

One page per session: what they said aloud, where they paused, the five scores,
and the single most surprising thing. Re-read all five together before changing
anything. Changing the game after each session means you tune for one person.

---

## 4. Stores: not yet, and here is why

Everything is already in place for this later (see
[ROADMAP.md](./ROADMAP.md#platform-plan) — Capacitor for iOS/Android, Tauri for
Windows/macOS/Steam, all reusing this exact build). None of it is worth starting
now:

| | |
|---|---|
| Apple Developer Program | ~$99/year, plus review, plus a privacy manifest |
| Google Play | one-off fee, plus a testing-track requirement before public release |
| Steam Direct | $100 per title, refundable against sales |

That is real money and several weeks of process overhead spent on a game that
has not yet been played by five strangers. The web build is the same game.

The one thing worth deciding *early*, because it is expensive to change later:
**how dark the content goes.** Domestic violence, alcohol, and — if the suicide
anchor act from your notes ever gets built — self-harm all drive age ratings and
can affect whether storefronts feature you at all. Worth setting a ceiling before
writing five more paths, not after.

---

## Appendix: running it on your own machine

You do not need this. It is here for the day you want a change to appear
instantly instead of two minutes later, or for a collaborator.

Install [Node.js](https://nodejs.org) 22+ and git, then:

```bash
git clone https://github.com/vallianatosdinos/meritocracy.git
cd meritocracy          # every npm command reads package.json from the folder
                        # you are standing in -- running npm from your home
                        # folder gives "Could not read package.json", which
                        # means "wrong place", not "broken"
npm install
npm run dev             # the printed Network URL works on a phone on the same wifi
```

| | |
|---|---|
| `npm test` | engine invariants |
| `npm run validate` | simulate thousands of lives, check the design bands |
| `npm run build` | production build into `dist/` |

---

## Cheat sheet

| I want to… | Do this |
|---|---|
| change the game | ask Claude |
| know if a change broke the thesis | **Actions** tab — red X means it did |
| get it on my phone | open the Pages URL, pull to refresh |
| publish a specific branch | **Actions** → *Deploy prototype* → Run workflow |
| know what to change | `src/content/paths/ten-digits.ts` (the life), `src/engine/tuning.ts` (the maths) |
