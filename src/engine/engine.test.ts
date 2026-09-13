import { describe, expect, it } from 'vitest'
import { tenDigits } from '../content'
import {
  appraiseFork,
  computeEnergyCap,
  isPlayableScale,
  replayWithEdit,
  rewindCost,
  simulate,
  TUNING,
  type Intent,
} from './index'

const driftIntents = (upTo = tenDigits.forks.length, seed = 7): Intent[] => {
  const intents: Intent[] = []
  for (let i = 0; i < upTo; i++) {
    const partial = simulate(tenDigits, seed, intents)
    const fork = tenDigits.forks[i]!
    const appraisal = appraiseFork(fork, partial.traits, partial.factors, partial.resources)
    intents.push({ optionIndex: appraisal.tendencyIndex })
  }
  return intents
}

const anchorIndex = tenDigits.forks.findIndex((f) => f.anchor)
const bedtimeIndex = tenDigits.forks.findIndex((f) => f.id === 'bedtime')

describe('determinism', () => {
  it('same seed and intents produce an identical life', () => {
    const intents = driftIntents()
    const a = simulate(tenDigits, 'abc', intents)
    const b = simulate(tenDigits, 'abc', intents)
    expect(b.records.map((r) => r.resolvedIndex)).toEqual(a.records.map((r) => r.resolvedIndex))
    expect(b.traits).toEqual(a.traits)
    expect(b.roll.map((r) => r.outcome.id)).toEqual(a.roll.map((r) => r.outcome.id))
  })

  it('different seeds produce different openings', () => {
    const keys = new Set(
      Array.from({ length: 40 }, (_, s) =>
        simulate(tenDigits, s, [])
          .roll.map((r) => r.outcome.id)
          .join('|'),
      ),
    )
    expect(keys.size).toBeGreaterThan(3)
  })
})

describe('rewind', () => {
  it('a shorter intent list is a strict prefix of the longer life', () => {
    const full = driftIntents()
    const truncated = full.slice(0, 6)
    const short = simulate(tenDigits, 7, truncated)
    const long = simulate(tenDigits, 7, full)
    expect(short.records).toHaveLength(6)
    expect(short.records.map((r) => r.resolvedIndex)).toEqual(
      long.records.slice(0, 6).map((r) => r.resolvedIndex),
    )
  })

  it('costs hindsight proportional to the distance travelled back', () => {
    expect(rewindCost(15, 14)).toBe(TUNING.hindsightMinimumCost)
    expect(rewindCost(15, 1)).toBeGreaterThan(rewindCost(15, 10))
  })
})

describe('the bedtime lever', () => {
  it('sleeping raises the energy ceiling available at the anchor', () => {
    const base = driftIntents()
    const slept = base.map((it, i) => (i === bedtimeIndex ? { optionIndex: 0 as const } : it))

    const withDrift = simulate(tenDigits, 7, base)
    const withSleep = simulate(tenDigits, 7, slept)

    const capOf = (r: typeof withDrift): number =>
      r.records[anchorIndex]?.energyCapAtFork ?? 0

    // Only meaningful if she actually managed to go to bed in the slept run.
    if (withSleep.records[bedtimeIndex]?.resolvedIndex === 0) {
      expect(capOf(withSleep)).toBeGreaterThan(capOf(withDrift))
    }
  })

  it('energy cap falls as sleep debt and stress rise', () => {
    expect(computeEnergyCap(64, 0, 0)).toBeGreaterThan(computeEnergyCap(64, 40, 0))
    expect(computeEnergyCap(64, 0, 0)).toBeGreaterThan(computeEnergyCap(64, 0, 60))
  })
})

describe('the receipt', () => {
  it('contributions sum to the leaning -- the game never hides a term', () => {
    for (let seed = 0; seed < 25; seed++) {
      const intents = driftIntents(anchorIndex, seed)
      const run = simulate(tenDigits, seed, intents)
      const fork = tenDigits.forks[anchorIndex]!
      const a = appraiseFork(fork, run.traits, run.factors, run.resources)
      const sum = a.contributions.reduce((acc, c) => acc + c.weight, 0)
      expect(sum).toBeCloseTo(a.leaning, 6)
    }
  })

  it('marks everything above the playable wall as locked', () => {
    const run = simulate(tenDigits, 3, driftIntents(anchorIndex, 3))
    const fork = tenDigits.forks[anchorIndex]!
    const a = appraiseFork(fork, run.traits, run.factors, run.resources)
    for (const c of a.contributions) {
      if (!isPlayableScale(c.scale)) expect(c.locked).toBe(true)
    }
    // and there is always something locked on the receipt
    expect(a.contributions.some((c) => c.locked)).toBe(true)
  })

  it('the tendency is always free and the other path never is', () => {
    const run = simulate(tenDigits, 11, driftIntents(anchorIndex, 11))
    const fork = tenDigits.forks[anchorIndex]!
    const a = appraiseFork(fork, run.traits, run.factors, run.resources)
    const tendency = a.options[a.tendencyIndex]
    const other = a.options[a.tendencyIndex === 0 ? 1 : 0]
    expect(tendency.energyCost).toBe(0)
    expect(tendency.successChance).toBe(1)
    expect(other.energyCost).toBeGreaterThan(0)
  })
})

describe('confabulation', () => {
  it('records a first-person justification whenever the game overrides the player', () => {
    let found = 0
    for (let seed = 0; seed < 60; seed++) {
      const intents = tenDigits.forks.map(() => ({ optionIndex: 0 as const }))
      const run = simulate(tenDigits, seed, intents)
      for (const r of run.records) {
        if (r.confabulated) {
          found++
          expect(r.resolvedIndex).not.toBe(r.intent.optionIndex)
          expect(typeof r.confabulation).toBe('string')
          expect(r.confabulation!.length).toBeGreaterThan(10)
        }
      }
    }
    expect(found).toBeGreaterThan(0)
  })

  it('never charges energy for an attempt that was never in reach', () => {
    for (let seed = 0; seed < 40; seed++) {
      const run = simulate(
        tenDigits,
        seed,
        tenDigits.forks.map(() => ({ optionIndex: 0 as const })),
      )
      for (const r of run.records) {
        if (r.outcome === 'blocked' && r.appraisal.options[0].feasibility === 'impossible') {
          expect(r.energySpent).toBe(0)
        }
      }
    }
  })
})

describe('choreography seam', () => {
  it('a perfect performance beats a hopeless one at the same fork', () => {
    const prefix = driftIntents(anchorIndex, 5)
    const perfect = simulate(tenDigits, 5, [...prefix, { optionIndex: 0, performance: 1 }])
    const fumbled = simulate(tenDigits, 5, [...prefix, { optionIndex: 0, performance: 0 }])
    const at = (r: typeof perfect) => r.records[anchorIndex]

    if (at(perfect)?.appraisal.options[0].feasibility === 'affordable') {
      expect(at(perfect)?.outcome).toBe('resisted')
      expect(at(fumbled)?.outcome).toBe('failed')
    }
  })
})

describe('the experiment: change one cause, keep every button press', () => {
  it('shifts likelihoods rather than switching outcomes', () => {
    const intents = driftIntents()
    let flippedSomething = 0
    let flippedTheAnchor = 0
    const trials = 40
    for (let seed = 0; seed < trials; seed++) {
      const base = driftIntents(tenDigits.forks.length, seed)
      const { divergences } = replayWithEdit(tenDigits, seed, base, bedtimeIndex, {
        optionIndex: 0,
      })
      if (divergences.length > 0) flippedSomething++
      if (divergences.some((d) => d.index === anchorIndex)) flippedTheAnchor++
    }
    expect(intents).toHaveLength(tenDigits.forks.length)
    // The edit visibly changes the life...
    expect(flippedSomething).toBeGreaterThan(0)
    // ...but sleeping one night does not reliably buy the phone call.
    expect(flippedTheAnchor).toBeLessThan(trials)
  })
})
