/**
 * Path validator.
 *
 * This script exists to answer the key design question -- "how do we generate
 * life paths that are meaningful?" -- by making "meaningful" a measurement
 * instead of a feeling.
 *
 * A path is meaningful when it is simultaneously:
 *   1. an argument   -- the player's in-the-moment button press barely moves
 *                       the anchor act;
 *   2. a game        -- playing the whole life well DOES move it, materially;
 *   3. not a lecture -- the opening roll (which the player never touches)
 *                       dominates both;
 *   4. well-built    -- every scene contributes at least one factor that the
 *                       anchor actually weighs, so no scene is decoration.
 *
 * Run: npm run validate
 */
import { appraiseFork, simulate, type Intent, type LifePath, type RunResult } from '../src/engine'
import { PATHS } from '../src/content'

const SAMPLES = 4000

/* ------------------------------------------------------------------ *
 * Target bands. These are the design spec. Argue with these numbers,
 * not with the prose.
 * ------------------------------------------------------------------ */
const BANDS = {
  /** Pressing the hard button only at the anchor, and nowhere else. */
  momentAgency: { min: 0.0, max: 0.15 },
  /** Playing the entire life toward the anchor. */
  lifetimeAgency: { min: 0.18, max: 0.55 },
  /** Spread of outcome across opening rolls, holding play constant. */
  rollDominance: { min: 0.2, max: 1.0 },
  /** Share of resolved forks where the game overrode the player. */
  confabulationRate: { min: 0.08, max: 0.45 },
}

type Strategy = 'drift' | 'anchorOnly' | 'willful'

/**
 * Convention, enforced here: options[0] of every fork is the effortful branch --
 * the one that costs something, reaches outward, or overrides a habit.
 * options[1] is the one the body would do on its own.
 */
const playOut = (path: LifePath, seed: number, strategy: Strategy): RunResult => {
  const intents: Intent[] = []
  for (let i = 0; i < path.forks.length; i++) {
    const partial = simulate(path, seed, intents)
    const fork = path.forks[i]
    if (!fork) break
    const appraisal = appraiseFork(fork, partial.traits, partial.factors, partial.resources)
    let want: 0 | 1
    if (strategy === 'drift') want = appraisal.tendencyIndex
    else if (strategy === 'willful') want = 0
    else want = fork.anchor ? 0 : appraisal.tendencyIndex
    intents.push({ optionIndex: want })
  }
  return simulate(path, seed, intents)
}

interface Sample {
  anchorTaken: boolean
  rollKey: string
  confabulated: number
  resolved: number
  anchorFeasibility: string
  energyAtAnchor: number
  energyCapAtAnchor: number
}

const sampleRuns = (path: LifePath, strategy: Strategy, n: number): Sample[] => {
  const out: Sample[] = []
  for (let s = 0; s < n; s++) {
    const run = playOut(path, s, strategy)
    const anchorRecord = run.records.find((r) => r.fork.anchor)
    if (!anchorRecord) throw new Error(`${path.id}: anchor fork never resolved`)
    out.push({
      anchorTaken: anchorRecord.resolvedIndex === 0,
      rollKey: run.roll.map((r) => r.outcome.id).join('|'),
      confabulated: run.records.filter((r) => r.confabulated).length,
      resolved: run.records.length,
      anchorFeasibility: anchorRecord.appraisal.options[0].feasibility,
      energyAtAnchor: anchorRecord.energyBefore,
      energyCapAtAnchor: anchorRecord.energyCapAtFork,
    })
  }
  return out
}

const rate = (xs: Sample[], pred: (s: Sample) => boolean): number =>
  xs.length === 0 ? 0 : xs.filter(pred).length / xs.length

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`

const inBand = (v: number, b: { min: number; max: number }): boolean => v >= b.min && v <= b.max

const verdict = (ok: boolean): string => (ok ? 'PASS' : 'FAIL')

/* ------------------------------------------------------------------ *
 * Structural checks -- authoring invariants, no simulation needed.
 * ------------------------------------------------------------------ */
const structuralCheck = (path: LifePath): string[] => {
  const problems: string[] = []

  const anchors = path.forks.filter((f) => f.anchor)
  if (anchors.length !== 1) problems.push(`expected exactly 1 anchor fork, found ${anchors.length}`)
  const anchor = anchors[0]

  const ids = new Set<string>()
  for (const f of path.forks) {
    if (ids.has(f.id)) problems.push(`duplicate fork id: ${f.id}`)
    ids.add(f.id)
  }

  const factorIds = new Set<string>()
  const collect = (id: string): void => {
    if (factorIds.has(id)) problems.push(`duplicate factor id: ${id}`)
    factorIds.add(id)
  }
  for (const cat of path.roll) for (const o of cat.outcomes) for (const f of o.factors) collect(f.id)
  for (const f of path.forks) for (const o of f.options) for (const g of o.grants ?? []) collect(g.id)

  if (!anchor) return problems

  /**
   * The rule that makes a path an argument rather than a story: every scene
   * must plant something the final act actually weighs. A scene that does not
   * show up on the anchor's receipt is decoration, and decoration is what makes
   * generated content feel like slop.
   */
  const weighedTags = new Set((anchor.weighing.tagTerms ?? []).map((t) => t.tag))
  const weighedTraits = new Set((anchor.weighing.traitTerms ?? []).map((t) => t.trait))

  for (const fork of path.forks) {
    if (fork.anchor) continue
    const earns = fork.options.some((opt) => {
      const viaTag = (opt.grants ?? []).some((g) => (g.tags ?? []).some((t) => weighedTags.has(t)))
      const viaTraitOnGrant = (opt.grants ?? []).some((g) =>
        Object.keys(g.traitDeltas ?? {}).some((t) => weighedTraits.has(t as never)),
      )
      const viaTraitDirect = Object.keys(opt.traitDeltas ?? {}).some((t) =>
        weighedTraits.has(t as never),
      )
      const viaSleep = (opt.grants ?? []).some((g) => g.resourceDeltas?.sleepDebt !== undefined)
      return viaTag || viaTraitOnGrant || viaTraitDirect || viaSleep
    })
    if (!earns) problems.push(`fork "${fork.id}" contributes nothing the anchor weighs -- it is decoration`)
  }

  // Tags weighed by the anchor that nothing in the path can ever produce.
  const producible = new Set<string>()
  for (const cat of path.roll)
    for (const o of cat.outcomes) for (const f of o.factors) for (const t of f.tags ?? []) producible.add(t)
  for (const f of path.forks)
    for (const o of f.options) for (const g of o.grants ?? []) for (const t of g.tags ?? []) producible.add(t)
  for (const t of weighedTags) {
    if (!producible.has(t)) problems.push(`anchor weighs tag "${t}" that nothing grants`)
  }

  return problems
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */
const report = (path: LifePath): boolean => {
  console.log(`\n${'='.repeat(72)}`)
  console.log(`PATH  ${path.id} -- "${path.title}"`)
  console.log(`ANCHOR  ${path.anchorAct}`)
  console.log('='.repeat(72))

  const problems = structuralCheck(path)
  console.log(`\n[structure]`)
  if (problems.length === 0) {
    console.log('  PASS  no structural problems')
  } else {
    for (const p of problems) console.log(`  FAIL  ${p}`)
  }

  const drift = sampleRuns(path, 'drift', SAMPLES)
  const anchorOnly = sampleRuns(path, 'anchorOnly', SAMPLES)
  const willful = sampleRuns(path, 'willful', SAMPLES)

  const pDrift = rate(drift, (s) => s.anchorTaken)
  const pAnchorOnly = rate(anchorOnly, (s) => s.anchorTaken)
  const pWillful = rate(willful, (s) => s.anchorTaken)

  const momentAgency = Math.abs(pAnchorOnly - pDrift)
  const lifetimeAgency = Math.abs(pWillful - pDrift)

  // Roll dominance: hold play constant (willful), group by roll, take the
  // spread of anchor rates across rolls that came up often enough to mean it.
  const byRoll = new Map<string, Sample[]>()
  for (const s of willful) {
    const arr = byRoll.get(s.rollKey) ?? []
    arr.push(s)
    byRoll.set(s.rollKey, arr)
  }
  const rollRates = [...byRoll.values()]
    .filter((g) => g.length >= 25)
    .map((g) => rate(g, (s) => s.anchorTaken))
  const rollDominance =
    rollRates.length > 1 ? Math.max(...rollRates) - Math.min(...rollRates) : 0

  const confab =
    willful.reduce((a, s) => a + s.confabulated, 0) /
    Math.max(1, willful.reduce((a, s) => a + s.resolved, 0))

  const checks: [string, number, { min: number; max: number }][] = [
    ['moment agency   (anchor press only)', momentAgency, BANDS.momentAgency],
    ['lifetime agency (whole life played)', lifetimeAgency, BANDS.lifetimeAgency],
    ['roll dominance  (unchosen origins) ', rollDominance, BANDS.rollDominance],
    ['confabulation rate                 ', confab, BANDS.confabulationRate],
  ]

  console.log(`\n[anchor act taken, by strategy]  n=${SAMPLES} seeds each`)
  console.log(`  drift       (always the tendency)        ${pct(pDrift)}`)
  console.log(`  anchorOnly  (resist only at 23:41)       ${pct(pAnchorOnly)}`)
  console.log(`  willful     (resist at every fork)       ${pct(pWillful)}`)

  console.log(`\n[design bands]`)
  let allOk = problems.length === 0
  for (const [label, value, band] of checks) {
    const ok = inBand(value, band)
    allOk = allOk && ok
    console.log(
      `  ${verdict(ok)}  ${label}  ${pct(value).padStart(7)}  ` +
        `target ${pct(band.min)}-${pct(band.max)}`,
    )
  }

  console.log(`\n[feasibility of the hard path at the anchor]  strategy=willful`)
  for (const f of ['affordable', 'out-of-reach', 'impossible']) {
    console.log(`  ${f.padEnd(13)} ${pct(rate(willful, (s) => s.anchorFeasibility === f))}`)
  }
  const avg = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)
  console.log(
    `  mean energy at anchor ${avg(willful.map((s) => s.energyAtAnchor)).toFixed(1)} ` +
      `of cap ${avg(willful.map((s) => s.energyCapAtAnchor)).toFixed(1)}`,
  )

  console.log(`\n[worst and best openings]  strategy=willful, rolls seen >=25 times`)
  const ranked = [...byRoll.entries()]
    .filter(([, g]) => g.length >= 25)
    .map(([k, g]) => [k, rate(g, (s) => s.anchorTaken), g.length] as const)
    .sort((a, b) => a[1] - b[1])
  for (const [k, r, n] of ranked.slice(0, 3)) console.log(`  ${pct(r).padStart(7)}  n=${n}  ${k}`)
  if (ranked.length > 3) {
    console.log('  ...')
    for (const [k, r, n] of ranked.slice(-3)) console.log(`  ${pct(r).padStart(7)}  n=${n}  ${k}`)
  }

  return allOk
}

let ok = true
for (const path of PATHS) ok = report(path) && ok
console.log(`\n${'='.repeat(72)}`)
console.log(ok ? 'ALL PATHS WITHIN SPEC' : 'SOME CHECKS OUTSIDE SPEC -- see FAILs above')
console.log('='.repeat(72))
process.exit(ok ? 0 : 1)
