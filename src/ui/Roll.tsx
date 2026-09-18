import {
  TRAIT_META,
  TRAITS,
  type RollOutcome,
  type RollRecord,
  type TraitId,
} from '../engine'

/**
 * What this outcome actually does to her.
 *
 * Gathered from both places a roll can move a trait: the baseline shift (no
 * paper trail -- there is nothing to point at, which is the complaint) and the
 * factors it grants (which stay nameable for the rest of the life).
 */
const traitDeltas = (o: RollOutcome): Array<[TraitId, number]> => {
  const acc = {} as Record<TraitId, number>
  const add = (d: Partial<Record<TraitId, number>> | undefined): void => {
    if (!d) return
    for (const t of TRAITS) if (d[t]) acc[t] = (acc[t] ?? 0) + (d[t] as number)
  }
  add(o.traitBaselineDeltas)
  for (const f of o.factors) add(f.traitDeltas)
  return TRAITS.filter((t) => acc[t]).map((t) => [t, acc[t]] as [TraitId, number])
}

const sleepDelta = (o: RollOutcome): number => {
  let n = o.resourceDeltas?.sleepDebt ?? 0
  for (const f of o.factors) n += f.resourceDeltas?.sleepDebt ?? 0
  return n
}

/** Is this change one she will be glad of? Stress and threat are inverted. */
const helps = (trait: TraitId, delta: number): boolean =>
  TRAIT_META[trait].inverted ? delta < 0 : delta > 0

export const RollItem = ({ record }: { record: RollRecord }): JSX.Element => {
  const deltas = traitDeltas(record.outcome)
  const sleep = sleepDelta(record.outcome)

  return (
    <div className="roll-item">
      <div className="roll-cat">{record.categoryLabel}</div>
      <p className="roll-prompt">{record.prompt}</p>
      <p className="roll-result">{record.outcome.label}</p>

      {/* The point of showing these: none of it is a reward, and she did none of it. */}
      <div className="roll-traits">
        {deltas.map(([trait, delta]) => (
          <span
            key={trait}
            className={`trait-chip ${helps(trait, delta) ? 'good' : 'bad'}`}
            title={TRAIT_META[trait].blurb}
          >
            {TRAIT_META[trait].label}
            <b>
              {delta > 0 ? '+' : '−'}
              {Math.abs(delta)}
            </b>
          </span>
        ))}
        {sleep !== 0 && (
          <span className={`trait-chip ${sleep < 0 ? 'good' : 'bad'}`} title="Sleep debt she starts with">
            Sleep debt
            <b>
              {sleep > 0 ? '+' : '−'}
              {Math.abs(sleep)}
            </b>
          </span>
        )}
      </div>

      <p className="roll-quip">{record.outcome.quip}</p>
    </div>
  )
}
