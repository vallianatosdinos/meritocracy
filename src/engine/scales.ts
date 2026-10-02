/**
 * Sapolsky's ladder.
 *
 * "Behave" works by taking a single act and asking what caused it one second
 * before, then one minute before, then hours, days, years, childhood, foetal
 * life, genes, culture, evolution -- and showing that there is no rung on the
 * ladder where an uncaused chooser is hiding.
 *
 * That ladder is our primary data axis. Every causal factor in the game is
 * stamped with the rung it lives on, and every decision receipt is sorted by
 * rung. The receipt is the argument.
 */
export const SCALES = [
  'evolution',
  'culture',
  'ancestry',
  'genes',
  'prenatal',
  'infancy',
  'childhood',
  'adolescence',
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
] as const

export type CausalScale = (typeof SCALES)[number]

/** Human-facing rung labels, as the narrator says them. */
export const SCALE_LABELS: Record<CausalScale, string> = {
  evolution: 'a few million years before',
  culture: 'the culture she was handed',
  ancestry: 'generations before',
  genes: 'before she was conceived',
  prenatal: 'before she was born',
  infancy: 'her first two years',
  childhood: 'her childhood',
  adolescence: 'her adolescence',
  years: 'years before',
  months: 'months before',
  weeks: 'weeks before',
  days: 'days before',
  hours: 'hours before',
  minutes: 'minutes before',
  seconds: 'seconds before',
}

/**
 * The rung tag: one word per rung, always spelled out. Abbreviations were tried
 * and read as noise.
 */
export const SCALE_NAMES: Record<CausalScale, string> = {
  evolution: 'Evolution',
  culture: 'Culture',
  ancestry: 'Ancestry',
  genes: 'Genes',
  prenatal: 'Prenatal',
  infancy: 'Infancy',
  childhood: 'Childhood',
  adolescence: 'Adolescence',
  years: 'Years',
  months: 'Months',
  weeks: 'Weeks',
  days: 'Days',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
}

export const scaleIndex = (s: CausalScale): number => SCALES.indexOf(s)

/**
 * The wall.
 *
 * Everything from 'childhood' down is lived on-screen and therefore rewindable.
 * Everything above it was settled by the opening roll: inspectable, never
 * editable. The player is allowed to walk right up to the wall, read what is
 * written on it, and get nothing.
 *
 * Childhood and adolescence sit on the playable side deliberately. You *can*
 * rewind to the seven-year-old under the desk -- and the resistance there is so
 * far beyond any budget she will ever have that you will fail anyway. A locked
 * door teaches less than an unlocked one you cannot walk through.
 *
 * (The ancestral-rewind mechanic in the notes lives on the other side of this
 * wall. See docs/ROADMAP.md -- deliberately not implemented yet.)
 */
export const FIRST_PLAYABLE_SCALE: CausalScale = 'childhood'

export const isPlayableScale = (s: CausalScale): boolean =>
  scaleIndex(s) >= scaleIndex(FIRST_PLAYABLE_SCALE)

/** Sort comparator: deepest cause first (evolution -> seconds). */
export const byScaleDepth = <T extends { scale: CausalScale }>(a: T, b: T): number =>
  scaleIndex(a.scale) - scaleIndex(b.scale)
