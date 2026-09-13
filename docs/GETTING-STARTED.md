# Getting started: running, publishing, and playtesting

Written assuming you have not deployed or playtested a game before. Nothing here
needs a paid account, an app store, or a developer licence.

**The order that matters:** get it on your phone → get it on a URL → put it in
front of five people → *then* think about stores. Stores are the last 5% of the
work and the first thing everybody wants to do. Skip them for now; there is a
section at the end about why.

---

## 1. Run it on your own machine

You need **Node.js 22 or newer** — one install, from [nodejs.org](https://nodejs.org)
(take the LTS button). Then, in a terminal, inside the project folder:

```bash
npm install     # once, ever (and again whenever dependencies change)
npm run dev
```

You will see something like:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.42:5173/
```

`Local` is for the machine you are sitting at. Leave it running — edit a file,
save, and the browser updates itself.

To stop it: `Ctrl+C` in that terminal.

## 2. Run it on your phone (30 seconds, no deploy)

That **Network** line is the whole trick. With your phone on the same wifi, type
that address into its browser. That is the real game, on a real device, with real
touch targets.

Do this early and often. It is the single highest-value habit in this project,
because the game is text and the difference between "reads fine" and "reads fine
on a 6-inch screen at arm's length" is enormous.

If the Network URL does not load: your laptop's firewall is usually the culprit
(macOS: System Settings → Network → Firewall; allow incoming for Node). Some
cafe/hotel wifi blocks device-to-device traffic entirely — use a phone hotspot
instead.

## 3. Put it on a public URL

Set up and committed already: pushing to `main` builds the game and publishes it
to **GitHub Pages**, free, on a URL anyone can open.

**One manual step, once** — GitHub cannot be told this from code:

> Repo → **Settings** → **Pages** → under *Build and deployment*, set
> **Source: GitHub Actions**.

After that:

- **Merge to `main`** → it publishes automatically.
- **Any branch, on demand** → repo → **Actions** tab → *Deploy prototype* →
  **Run workflow**, pick the branch. This is how you get a link for work that
  is not merged yet.

Your URL will be:

```
https://vallianatosdinos.github.io/meritocracy/
```

The first deploy takes a couple of minutes; later ones about one. If the Actions
tab shows a red X, click into the run — the failing step names itself.

### The other workflow

Every push also runs **CI**: typecheck, engine tests, path validation, build.
That last one is worth understanding — it simulates thousands of lives and
**fails the build if a path drifts outside its design bands**. If you tweak a
coefficient and accidentally hand the player too much free will, CI goes red. The
thesis is a test, not a matter of taste.

Run the same checks locally any time:

```bash
npm test
npm run validate
```

---

## 4. Playtesting

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

## 5. Stores: not yet, and here is why

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

## Cheat sheet

```bash
npm install        # once
npm run dev        # play it; Network URL works on your phone
npm test           # engine invariants
npm run validate   # simulate thousands of lives, check the design bands
npm run build      # production build into dist/
```

| I want to… | Do this |
|---|---|
| play it on my phone | `npm run dev`, open the Network URL |
| send someone a link | Actions tab → *Deploy prototype* → Run workflow |
| know if I broke the thesis | `npm run validate` |
| change how a life feels | `src/content/paths/ten-digits.ts`, then validate |
| change the maths | `src/engine/tuning.ts`, then validate |
