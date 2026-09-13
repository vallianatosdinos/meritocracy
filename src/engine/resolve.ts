import { byScaleDepth, isPlayableScale } from './scales'
import { TUNING } from './tuning'
import { TRAITS, type TraitId, type TraitSheet } from './traits'
import type {
  Contribution,
  Factor,
  Feasibility,
  Fork,
  ForkAppraisal,
  OptionAppraisal,
  Resources,
} from './types'

/**
 * The energy ceiling is derived, never chosen. This matters more than it looks:
 * if the player could earn energy by playing well, the game would be arguing
 * that she could have tried harder -- the opposite of the thesis. Energy comes
 * from history and only from history.
 */
export const computeEnergyCap = (
  baseCap: number,
  sleepDebt: number,
  stressLoad: number,
): number =>
  Math.max(
    0,
    Math.round(
      baseCap -
        sleepDebt * TUNING.energyCapPerSleepDebt -
        stressLoad * TUNING.energyCapPerStressLoad,
    ),
  )

/**
 * Decompose a trait's pull back into the facts that built the trait.
 *
 * A stat block is a bad argument -- "she has low Impulse Control" explains
 * nothing. So a trait term never appears on a receipt as itself. It is split
 * across its provenance, proportionally, so the receipt names a bedtime, a
 * shift, a thrown plate, and a coin flip before birth.
 */
const decomposeTrait = (
  trait: TraitId,
  coef: number,
  label: string,
  sheet: TraitSheet,
): Contribution[] => {
  const state = sheet[trait]
  const total = coef * (state.value / 100)
  if (total === 0) return []

  const deltaSum = state.provenance.reduce((acc, p) => acc + p.delta, 0)
  const denom = state.baseline + deltaSum
  if (denom === 0) {
    return [
      { scale: 'genes', label, note: 'issued', weight: total, locked: true, sourceForkId: null },
    ]
  }

  const out: Contribution[] = []
  if (state.baseline !== 0) {
    out.push({
      scale: 'genes',
      label,
      note: 'issued',
      weight: total * (state.baseline / denom),
      locked: true,
      sourceForkId: null,
    })
  }
  for (const p of state.provenance) {
    if (p.delta === 0) continue
    out.push({
      scale: p.scale,
      label: p.label,
      weight: total * (p.delta / denom),
      factorId: p.factorId,
      sourceForkId: p.sourceForkId,
      locked: !isPlayableScale(p.scale) || p.sourceForkId === null,
    })
  }
  return out
}

/** Factors argue directly when a fork weighs one of their tags. */
const tagContributions = (
  fork: Fork,
  factors: readonly Factor[],
): Contribution[] => {
  const terms = fork.weighing.tagTerms ?? []
  if (terms.length === 0) return []
  const out: Contribution[] = []
  for (const term of terms) {
    for (const f of factors) {
      if (!f.tags?.includes(term.tag)) continue
      out.push({
        scale: f.scale,
        // Always the concrete fact, never the tag's gloss: two facts sharing a
        // tag are two separate causes and must read as two separate lines.
        label: f.label,
        note: term.label,
        weight: term.coef,
        factorId: f.id,
        sourceForkId: f.sourceForkId ?? null,
        locked: f.locked === true || !isPlayableScale(f.scale) || f.sourceForkId == null,
      })
    }
  }
  return out
}

const resistanceToSuccessChance = (resistance: number): number => {
  const { resistanceAtEvenOdds, resistanceAtFloor, successFloor, successCeiling } = TUNING
  if (resistance <= 0) return successCeiling
  // Linear from (0, ceiling) through (evenOdds, 0.5) to (floorPoint, floor).
  const chance =
    resistance <= resistanceAtEvenOdds
      ? successCeiling - (resistance / resistanceAtEvenOdds) * (successCeiling - 0.5)
      : 0.5 -
        ((resistance - resistanceAtEvenOdds) /
          Math.max(1, resistanceAtFloor - resistanceAtEvenOdds)) *
          (0.5 - successFloor)
  return Math.max(successFloor, Math.min(successCeiling, chance))
}

const feasibilityOf = (cost: number, resources: Resources): Feasibility => {
  if (cost > TUNING.absoluteEnergyCeiling) return 'impossible'
  if (cost > resources.energyCap) return 'impossible'
  if (cost > resources.energy) return 'out-of-reach'
  return 'affordable'
}

/**
 * Read the fork. Produces the leaning, the full receipt, and an appraisal of
 * both options -- none of which the player is shown before choosing.
 */
export const appraiseFork = (
  fork: Fork,
  traits: TraitSheet,
  factors: readonly Factor[],
  resources: Resources,
): ForkAppraisal => {
  const contributions: Contribution[] = [
    {
      scale: 'seconds' as const,
      label: fork.weighing.baseLabel,
      weight: fork.weighing.base,
      locked: true,
      sourceForkId: null,
    },
    ...(fork.weighing.traitTerms ?? []).flatMap((t) =>
      decomposeTrait(t.trait, t.coef, t.label, traits),
    ),
    ...tagContributions(fork, factors),
  ]
    .filter((c) => c.weight !== 0)
    .sort(byScaleDepth)

  const leaning = contributions.reduce((acc, c) => acc + c.weight, 0)
  const tendencyIndex: 0 | 1 = leaning >= 0 ? 0 : 1
  const resistance = Math.abs(leaning)

  const appraise = (index: 0 | 1): OptionAppraisal => {
    const isTendency = index === tendencyIndex
    const r = isTendency ? 0 : resistance
    const energyCost = isTendency ? 0 : Math.ceil(r * TUNING.energyPerResistance)
    return {
      optionIndex: index,
      isTendency,
      resistance: r,
      energyCost,
      successChance: isTendency ? 1 : resistanceToSuccessChance(r),
      feasibility: isTendency ? 'affordable' : feasibilityOf(energyCost, resources),
    }
  }

  return {
    forkId: fork.id,
    leaning,
    tendencyIndex,
    contributions,
    options: [appraise(0), appraise(1)],
  }
}

/** Sum of trait values, for cheap regression checks in tests. */
export const traitVector = (sheet: TraitSheet): Record<TraitId, number> => {
  const out = {} as Record<TraitId, number>
  for (const t of TRAITS) out[t] = sheet[t].value
  return out
}
