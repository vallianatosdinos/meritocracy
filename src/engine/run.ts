import { makeRng, type Rng } from './rng'
import { appraiseFork, computeEnergyCap } from './resolve'
import type { CausalScale } from './scales'
import { TUNING } from './tuning'
import {
  clampTrait,
  cloneTraitSheet,
  makeTraitSheet,
  TRAITS,
  type TraitId,
  type TraitSheet,
} from './traits'
import type {
  Factor,
  Fork,
  ForkAppraisal,
  LifePath,
  ResourceDeltas,
  Resources,
  RollOutcome,
} from './types'

/**
 * What the player pressed. Note that this is an *intent*, not a decision --
 * the engine decides what actually happens.
 */
export interface Intent {
  optionIndex: 0 | 1
  /**
   * 0..1 quality of the button choreography, once that exists. Undefined means
   * "roll it", which is what the prototype does. This is the single seam where
   * the choreography minigame plugs in later.
   */
  performance?: number
}

export type ForkOutcome =
  /** Went with the tendency. Free, instant, frictionless. The "whatever". */
  | 'flowed'
  /** Went against it and made it. Paid for. */
  | 'resisted'
  /** Went against it, paid, and failed anyway. Confabulation follows. */
  | 'failed'
  /** Never in reach. She did not even get close. */
  | 'blocked'

export interface ForkRecord {
  index: number
  fork: Fork
  appraisal: ForkAppraisal
  intent: Intent
  resolvedIndex: 0 | 1
  /** True when what happened is not what the player pressed. */
  confabulated: boolean
  outcome: ForkOutcome
  energyBefore: number
  energySpent: number
  energyCapAtFork: number
  narration: string
  /** The character's own account of a decision she did not make. */
  confabulation?: string
}

export interface RollRecord {
  categoryId: string
  categoryLabel: string
  prompt: string
  outcome: RollOutcome
}

export interface RunResult {
  path: LifePath
  seed: number
  roll: RollRecord[]
  traits: TraitSheet
  resources: Resources
  factors: Factor[]
  records: ForkRecord[]
  /** Index of the next unplayed fork, or path.forks.length when finished. */
  cursor: number
  finished: boolean
  /** Set once the anchor fork has resolved. */
  anchor: { taken: boolean; record: ForkRecord } | null
}

/** Scales that share one continuous energy budget: the final day. */
const CONTINUOUS_BAND: readonly CausalScale[] = ['days', 'hours', 'minutes', 'seconds']

/**
 * Energy resets on entering a new scale rung, except inside the final day.
 *
 * The biographical scenes (years, months, weeks) each get their own budget --
 * they are separate occasions, not one long afternoon. The endgame does not:
 * days/hours/minutes/seconds share a single pool, which is why a bad bedtime is
 * still on the books at 23:41.
 */
const carriesEnergy = (prev: CausalScale | null, next: CausalScale): boolean =>
  prev !== null && CONTINUOUS_BAND.includes(prev) && CONTINUOUS_BAND.includes(next)

interface MutableState {
  traits: TraitSheet
  resources: Resources
  factors: Factor[]
}

const applyResourceDeltas = (
  resources: Resources,
  deltas: Partial<ResourceDeltas> | undefined,
): void => {
  if (!deltas) return
  if (deltas.energy !== undefined) resources.energy += deltas.energy
  if (deltas.money !== undefined) resources.money += deltas.money
  if (deltas.health !== undefined) resources.health += deltas.health
  if (deltas.sleepDebt !== undefined)
    resources.sleepDebt = Math.max(0, Math.min(100, resources.sleepDebt + deltas.sleepDebt))
  if (deltas.hindsight !== undefined) resources.hindsight += deltas.hindsight
}

const applyTraitDeltas = (
  state: MutableState,
  deltas: Partial<Record<TraitId, number>> | undefined,
  provenance: { factorId: string; label: string; scale: CausalScale; sourceForkId: string | null } | null,
): void => {
  if (!deltas) return
  for (const t of TRAITS) {
    const d = deltas[t]
    if (d === undefined || d === 0) continue
    const trait = state.traits[t]
    trait.value = clampTrait(trait.value + d)
    if (provenance) {
      trait.provenance.push({ ...provenance, delta: d })
    } else {
      trait.baseline = clampTrait(trait.baseline + d)
    }
  }
}

const acquireFactor = (state: MutableState, factor: Factor, sourceForkId: string | null): void => {
  const stamped: Factor = { ...factor, sourceForkId: factor.sourceForkId ?? sourceForkId }
  state.factors.push(stamped)
  applyTraitDeltas(state, stamped.traitDeltas, {
    factorId: stamped.id,
    label: stamped.label,
    scale: stamped.scale,
    sourceForkId: stamped.sourceForkId ?? null,
  })
  applyResourceDeltas(state.resources, stamped.resourceDeltas)
}

const weightedPick = (outcomes: readonly RollOutcome[], rng: Rng): RollOutcome => {
  const total = outcomes.reduce((acc, o) => acc + o.weight, 0)
  let r = rng.next() * total
  for (const o of outcomes) {
    r -= o.weight
    if (r <= 0) return o
  }
  const last = outcomes[outcomes.length - 1]
  if (!last) throw new Error('roll category has no outcomes')
  return last
}

/**
 * The roll. Everything here happened to the character, not because of her.
 * It also quietly sets the hindsight budget -- how much of this life the player
 * will be allowed to re-examine. That is not surfaced as a roll result until
 * much later; see docs/DESIGN.md, "The third reveal".
 */
const performRoll = (path: LifePath, rng: Rng): { roll: RollRecord[]; state: MutableState } => {
  const state: MutableState = {
    traits: makeTraitSheet(path.baselineTraits),
    resources: {
      ...path.baselineResources,
      energyCap: 0,
    },
    factors: [],
  }

  const roll: RollRecord[] = []
  for (const category of path.roll) {
    const outcome = weightedPick(category.outcomes, rng.fork(`roll:${category.id}`))
    roll.push({
      categoryId: category.id,
      categoryLabel: category.label,
      prompt: category.prompt,
      outcome,
    })
    // Baseline deltas move the floor, not the paper trail: there is nothing to
    // point at, which is precisely the complaint.
    applyTraitDeltas(state, outcome.traitBaselineDeltas, null)
    applyResourceDeltas(state.resources, outcome.resourceDeltas)
    if (outcome.hindsightDelta) state.resources.hindsight += outcome.hindsightDelta
    for (const f of outcome.factors) acquireFactor(state, { ...f, locked: true }, null)
  }

  state.resources.energyCap = computeEnergyCap(
    path.baselineResources.energy,
    state.resources.sleepDebt,
    state.traits.stressLoad.value,
  )
  state.resources.energy = state.resources.energyCap
  return { roll, state }
}

const resolveFork = (
  fork: Fork,
  appraisal: ForkAppraisal,
  intent: Intent,
  resources: Resources,
  rng: Rng,
): { resolvedIndex: 0 | 1; outcome: ForkOutcome; energySpent: number } => {
  const wanted = appraisal.options[intent.optionIndex]
  if (wanted.isTendency) {
    return { resolvedIndex: intent.optionIndex, outcome: 'flowed', energySpent: 0 }
  }

  if (wanted.feasibility === 'impossible') {
    return { resolvedIndex: appraisal.tendencyIndex, outcome: 'blocked', energySpent: 0 }
  }

  if (wanted.feasibility === 'out-of-reach') {
    // She tries. She empties out. It is not enough, and it was never going to be.
    return {
      resolvedIndex: appraisal.tendencyIndex,
      outcome: 'blocked',
      energySpent: resources.energy,
    }
  }

  const succeeded =
    intent.performance === undefined
      ? rng.next() < wanted.successChance
      : intent.performance >= 1 - wanted.successChance

  return {
    resolvedIndex: succeeded ? intent.optionIndex : appraisal.tendencyIndex,
    outcome: succeeded ? 'resisted' : 'failed',
    // Trying costs the same as succeeding. This is not a bug.
    energySpent: wanted.energyCost,
  }
}

/**
 * Replay a life from its seed and a list of intents.
 *
 * Everything the game does is a call to this. A rewind is `simulate` with a
 * shorter intent list; the "press the same buttons and watch a different life
 * come out" experiment is `simulate` with one entry swapped.
 */
export const simulate = (path: LifePath, seed: number | string, intents: readonly Intent[]): RunResult => {
  const rng = makeRng(seed)
  const { roll, state } = performRoll(path, rng)

  const records: ForkRecord[] = []
  let anchor: RunResult['anchor'] = null
  let prevScale: CausalScale | null = null

  for (let i = 0; i < path.forks.length; i++) {
    const fork = path.forks[i]
    if (!fork) break
    const intent = intents[i]

    state.resources.energyCap = computeEnergyCap(
      path.baselineResources.energy,
      state.resources.sleepDebt,
      state.traits.stressLoad.value,
    )
    if (!carriesEnergy(prevScale, fork.scale)) {
      state.resources.energy = state.resources.energyCap
    }
    state.resources.energy = Math.max(0, Math.min(state.resources.energy, state.resources.energyCap))

    if (!intent) break // unplayed from here on

    const appraisal = appraiseFork(fork, state.traits, state.factors, state.resources)
    const energyBefore = state.resources.energy
    const energyCapAtFork = state.resources.energyCap
    const { resolvedIndex, outcome, energySpent } = resolveFork(
      fork,
      appraisal,
      intent,
      state.resources,
      rng.fork(`fork:${fork.id}`),
    )

    state.resources.energy = Math.max(0, state.resources.energy - energySpent)

    const chosen = fork.options[resolvedIndex]
    applyTraitDeltas(state, chosen.traitDeltas, {
      factorId: `${fork.id}:${chosen.id}`,
      label: chosen.label,
      scale: fork.scale,
      sourceForkId: fork.id,
    })
    applyResourceDeltas(state.resources, chosen.resourceDeltas)
    for (const f of chosen.grants ?? []) acquireFactor(state, f, fork.id)

    const confabulated = resolvedIndex !== intent.optionIndex
    const record: ForkRecord = {
      index: i,
      fork,
      appraisal,
      intent,
      resolvedIndex,
      confabulated,
      outcome,
      energyBefore,
      energySpent,
      energyCapAtFork,
      narration: chosen.narration,
      confabulation: confabulated ? chosen.confabulation : undefined,
    }
    records.push(record)

    if (fork.anchor) {
      anchor = { taken: resolvedIndex === 0, record }
    }

    prevScale = fork.scale
  }

  return {
    path,
    seed: rng.seed,
    roll,
    traits: cloneTraitSheet(state.traits),
    resources: { ...state.resources },
    factors: [...state.factors],
    records,
    cursor: records.length,
    finished: records.length === path.forks.length,
    anchor,
  }
}

/** Appraise the fork the player is currently looking at, without resolving it. */
export const peek = (run: RunResult): { fork: Fork; appraisal: ForkAppraisal } | null => {
  const fork = run.path.forks[run.cursor]
  if (!fork) return null
  return {
    fork,
    appraisal: appraiseFork(fork, run.traits, run.factors, run.resources),
  }
}

export const rewindCost = (fromIndex: number, toIndex: number): number =>
  Math.max(
    TUNING.hindsightMinimumCost,
    Math.abs(fromIndex - toIndex) * TUNING.hindsightPerForkOfDistance,
  )

/**
 * The experiment. Change one earlier intent, keep every later button press
 * identical, and re-run. Returns both lives plus the forks that came out
 * differently.
 *
 * This is the mechanic that does the arguing: the player learns that editing a
 * cause shifts odds rather than switching outcomes, and that most of the
 * downstream life is indifferent to the edit.
 */
export interface Divergence {
  index: number
  forkId: string
  before: { resolvedIndex: 0 | 1; outcome: ForkOutcome }
  after: { resolvedIndex: 0 | 1; outcome: ForkOutcome }
}

export const diffRuns = (before: RunResult, after: RunResult): Divergence[] => {
  const divergences: Divergence[] = []
  const n = Math.min(before.records.length, after.records.length)
  for (let i = 0; i < n; i++) {
    const b = before.records[i]
    const a = after.records[i]
    if (!b || !a) continue
    if (b.resolvedIndex !== a.resolvedIndex || b.outcome !== a.outcome) {
      divergences.push({
        index: i,
        forkId: b.fork.id,
        before: { resolvedIndex: b.resolvedIndex, outcome: b.outcome },
        after: { resolvedIndex: a.resolvedIndex, outcome: a.outcome },
      })
    }
  }
  return divergences
}

export const replayWithEdit = (
  path: LifePath,
  seed: number | string,
  intents: readonly Intent[],
  editIndex: number,
  newIntent: Intent,
): { before: RunResult; after: RunResult; divergences: Divergence[] } => {
  const before = simulate(path, seed, intents)
  const after = simulate(
    path,
    seed,
    intents.map((it, i) => (i === editIndex ? newIntent : it)),
  )
  return { before, after, divergences: diffRuns(before, after) }
}
