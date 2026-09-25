/**
 * Every number the designer will want to argue about, in one file.
 *
 * These are first-draft values, set so that the hand-crafted path in
 * src/content/paths reads the way it is meant to. They are almost certainly
 * wrong. `npm run validate` measures what they actually produce.
 */
export const TUNING = {
  /**
   * Energy burned per unit of resistance when acting against the tendency.
   *
   * Raised from 1.45 when the success roll was removed. With the roll, about
   * half of affordable resists failed anyway; without it every one succeeds and
   * the successes compound, which took lifetime agency from 50% to 89% -- a game
   * arguing for free will. Pricing resistance higher restores the old shape:
   * roughly half of lives can make the call under perfect play.
   */
  energyPerResistance: 2.2,

  /** The best energy ceiling any life in this build can reach. Defines 'impossible'. */
  absoluteEnergyCeiling: 100,

  /** Sleep debt is the cheapest, most insulting lever in the game. */
  energyCapPerSleepDebt: 0.45,
  energyCapPerStressLoad: 0.25,

  /**
   * Difficulty curve for the button choreography, when it exists. There is no
   * dice roll behind these any more: without a performance, an affordable
   * resist simply succeeds.
   */
  resistanceAtEvenOdds: 26,
  resistanceAtFloor: 70,
  successFloor: 0.05,
  successCeiling: 0.97,

  /** Hindsight cost to rewind, per fork of distance travelled backwards. */
  hindsightPerForkOfDistance: 1,
  hindsightMinimumCost: 2,

  /** Contributions smaller than this are folded into "and a hundred other things". */
  receiptNoiseFloor: 0.75,
} as const
