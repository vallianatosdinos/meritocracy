import type { CausalScale } from './scales'
import type { TraitId } from './traits'

/* ------------------------------------------------------------------ *
 * FACTORS -- the atoms of the model.
 *
 * A Factor is one fact about the character's history. Not a stat, not an
 * event: a *fact that argues*. Every factor is stamped with a causal scale,
 * carries tags so that forks can weigh it without naming it directly, and
 * either can or cannot be reached by a rewind.
 * ------------------------------------------------------------------ */

export interface Factor {
  id: string
  scale: CausalScale
  /** Receipt line. Short, concrete, no jargon. "Four hours of sleep." */
  label: string
  /** The narrator's longer gloss, shown when the player drills in. */
  detail?: string
  /** Applied once, when the factor is acquired. */
  traitDeltas?: Partial<Record<TraitId, number>>
  resourceDeltas?: Partial<ResourceDeltas>
  /** Forks reference these instead of hard-coding factor ids. */
  tags?: string[]
  /**
   * Locked factors can be read but never edited. Anything above the playable
   * scale wall is locked by construction; a lived scene can also be locked
   * when the path author wants a visible, unfixable cause.
   */
  locked?: boolean
  /** The fork that granted this, or null for the opening roll. */
  sourceForkId?: string | null
}

/* ------------------------------------------------------------------ *
 * RESOURCES -- the fast-moving state.
 * ------------------------------------------------------------------ */

export interface Resources {
  /** Spent to act against the tendency. Refills only through scenes. */
  energy: number
  /** Hard ceiling, itself derived from sleep debt and stress. */
  energyCap: number
  money: number
  health: number
  /** 0-100. Suppresses energyCap. The cheapest lever in the game. */
  sleepDebt: number
  /** Meta-currency: the cost of stepping out of the life and rewinding it. */
  hindsight: number
}

export type ResourceDeltas = Omit<Resources, 'energyCap'>

/* ------------------------------------------------------------------ *
 * WEIGHING -- how a fork converts history into a leaning.
 *
 * Positive contributions pull toward options[0]. Negative pull toward
 * options[1]. Nothing else is going on. The player can audit all of it after
 * the fact, which is the point: the game never lies, it just never tells you
 * in advance.
 * ------------------------------------------------------------------ */

export interface TraitTerm {
  trait: TraitId
  /**
   * Pull contributed at full trait value (100). Signed: positive pulls toward
   * options[0]. Contribution is coef * (value / 100), then decomposed across
   * the trait's provenance so the receipt can name real causes rather than
   * abstract stats.
   */
  coef: number
  /** Receipt wording for the baseline share of this trait. */
  label: string
}

export interface TagTerm {
  tag: string
  coef: number
  /**
   * Optional gloss explaining what this tag means AT THIS FORK. It is shown as a
   * qualifier, never as the row label -- the row always names the concrete fact,
   * because several facts can carry the same tag and a shared label would make
   * two different causes look like one duplicated one.
   */
  label?: string
}

export interface Weighing {
  /**
   * Situational baseline -- the pull of the immediate moment itself, before
   * any history. Lives at 'seconds' on the receipt.
   */
  base: number
  baseLabel: string
  traitTerms?: TraitTerm[]
  tagTerms?: TagTerm[]
}

/* ------------------------------------------------------------------ *
 * FORKS
 * ------------------------------------------------------------------ */

export interface ForkOption {
  id: string
  /** Button text. Always an action, always plain. "Dial." / "Put the phone down." */
  label: string
  /** What the narrator reports once this path is taken. */
  narration: string
  /**
   * First-person justification, used when the character does THIS while the
   * player pressed the other one. The confabulation engine's raw material:
   * the mind explaining a decision it did not make.
   */
  confabulation?: string
  grants?: Factor[]
  traitDeltas?: Partial<Record<TraitId, number>>
  resourceDeltas?: Partial<ResourceDeltas>
}

export interface Fork {
  id: string
  scale: CausalScale
  /** Clock//place caption, e.g. "23:41 -- the kitchen". */
  when: string
  /** Set-up prose. Second person is reserved for the PLAYER, never the character. */
  prose: string
  options: [ForkOption, ForkOption]
  weighing: Weighing
  /**
   * The act the whole path exists to explain. Exactly one fork per path is
   * the anchor; validate.ts enforces it.
   */
  anchor?: boolean
  /**
   * Narrator aside shown after resolution -- the cynical voice.
   */
  aside?: string
}

/* ------------------------------------------------------------------ *
 * THE OPENING ROLL -- everything the character did not choose.
 * ------------------------------------------------------------------ */

export interface RollOutcome {
  id: string
  label: string
  /** The snide line the narrator delivers as this lands. */
  quip: string
  weight: number
  factors: Factor[]
  traitBaselineDeltas?: Partial<Record<TraitId, number>>
  resourceDeltas?: Partial<ResourceDeltas>
  /**
   * How much rewinding this life affords. Set here, before the player has done
   * anything, and deliberately not surfaced as "your" budget until late.
   */
  hindsightDelta?: number
}

export interface RollCategory {
  id: string
  label: string
  /** "You did not pick this." framing shown above the outcomes. */
  prompt: string
  outcomes: RollOutcome[]
}

/* ------------------------------------------------------------------ *
 * LIFE PATH -- a causal argument with narrative skin.
 * ------------------------------------------------------------------ */

export interface LifePath {
  id: string
  title: string
  /** The act this path exists to explain, in one sentence. */
  anchorAct: string
  character: { name: string; pronoun: 'she' | 'he' | 'they' }
  /** Author's note: the thesis this path is trying to land. Not shown in game. */
  intent: string
  roll: RollCategory[]
  baselineTraits: Record<TraitId, number>
  baselineResources: ResourceDeltas
  forks: Fork[]
  epilogue: {
    /** Shown when the anchor act happened. */
    onAnchorTaken: string
    /** Shown when it did not. */
    onAnchorRefused: string
    /** Always shown last, identical either way. The refusal to reward. */
    coda: string
  }
}

/* ------------------------------------------------------------------ *
 * RESOLUTION OUTPUT
 * ------------------------------------------------------------------ */

export interface Contribution {
  scale: CausalScale
  label: string
  /** Small qualifier shown beside the label: 'issued', or a fork-specific gloss. */
  note?: string
  /** Signed pull: positive toward options[0]. */
  weight: number
  /** Factor that produced it, when traceable. */
  factorId?: string
  /** Fork whose choice produced it -- the rewind target. */
  sourceForkId?: string | null
  locked: boolean
}

export type Feasibility =
  /** Cost fits inside current energy. */
  | 'affordable'
  /** Would fit the cap, but not what she has left right now. Rewind bait. */
  | 'out-of-reach'
  /** Exceeds the cap this life can ever hold. The wall. */
  | 'impossible'

export interface OptionAppraisal {
  optionIndex: 0 | 1
  isTendency: boolean
  /** How hard the rest of history pushes against this option. */
  resistance: number
  energyCost: number
  /** 0..1. In the prototype this is rolled; later it is the choreography. */
  successChance: number
  feasibility: Feasibility
}

export interface ForkAppraisal {
  forkId: string
  /** Signed. Positive means history leans toward options[0]. */
  leaning: number
  tendencyIndex: 0 | 1
  contributions: Contribution[]
  options: [OptionAppraisal, OptionAppraisal]
}
