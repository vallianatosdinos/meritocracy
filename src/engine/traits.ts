import type { CausalScale } from './scales'

/**
 * Eight traits. Each one is chosen because it has a legible, unearned
 * provenance in the literature -- you can point at what built it, and the
 * player never built any of it.
 *
 * Deliberately NOT in this list: anything that reads as virtue. There is no
 * "willpower" stat, because a willpower stat tells the player they could have
 * tried harder, which is the exact belief the game exists to dismantle.
 */
export const TRAITS = [
  'impulseControl',
  'stressLoad',
  'threatSensitivity',
  'trust',
  'noveltySeeking',
  'empathyReach',
  'belonging',
  'conscientiousness',
] as const

export type TraitId = (typeof TRAITS)[number]

export interface TraitMeta {
  label: string
  /** What the narrator says it is, without jargon. */
  blurb: string
  /** true when a high value makes life harder (stress, threat). */
  inverted: boolean
}

export const TRAIT_META: Record<TraitId, TraitMeta> = {
  impulseControl: {
    label: 'Impulse Control',
    blurb: 'How much frontal cortex is online right now. Sleep, sugar and calm buy it; stress spends it.',
    inverted: false,
  },
  stressLoad: {
    label: 'Stress Load',
    blurb: 'Everything the body is already carrying before today asks anything of it.',
    inverted: true,
  },
  threatSensitivity: {
    label: 'Threat Sensitivity',
    blurb: 'How fast a room turns into a danger. Set early, mostly by people who are no longer present.',
    inverted: true,
  },
  trust: {
    label: 'Trust',
    blurb: 'The default assumption that reaching out will not cost her.',
    inverted: false,
  },
  noveltySeeking: {
    label: 'Novelty Seeking',
    blurb: 'How badly the unfamiliar itches. Partly inherited, entirely unrequested.',
    inverted: false,
  },
  empathyReach: {
    label: 'Empathy Reach',
    blurb: 'How far out the circle of people who count extends. Widened only by contact.',
    inverted: false,
  },
  belonging: {
    label: 'Belonging',
    blurb: 'Whether there is anyone whose opinion of her survives the night.',
    inverted: false,
  },
  conscientiousness: {
    label: 'Conscientiousness',
    blurb: 'The habit of finishing things. A habit, which means somebody installed it.',
    inverted: false,
  },
}

/** One entry in a trait's paper trail: which fact moved it, and by how much. */
export interface ProvenanceEntry {
  factorId: string
  label: string
  scale: CausalScale
  delta: number
  /** Scene that granted it, if any. null means the opening roll. */
  sourceForkId: string | null
}

export interface TraitState {
  value: number
  /** Value before any factor touched it -- i.e. the roll's baseline. */
  baseline: number
  provenance: ProvenanceEntry[]
}

export type TraitSheet = Record<TraitId, TraitState>

export const TRAIT_MIN = 0
export const TRAIT_MAX = 100

export const clampTrait = (n: number): number =>
  Math.max(TRAIT_MIN, Math.min(TRAIT_MAX, n))

export const makeTraitSheet = (baselines: Record<TraitId, number>): TraitSheet => {
  const sheet = {} as TraitSheet
  for (const t of TRAITS) {
    const v = clampTrait(baselines[t])
    sheet[t] = { value: v, baseline: v, provenance: [] }
  }
  return sheet
}

export const cloneTraitSheet = (sheet: TraitSheet): TraitSheet => {
  const out = {} as TraitSheet
  for (const t of TRAITS) {
    const s = sheet[t]
    out[t] = { value: s.value, baseline: s.baseline, provenance: [...s.provenance] }
  }
  return out
}
