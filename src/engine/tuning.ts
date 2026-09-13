/**
 * Every number the designer will want to argue about, in one file.
 *
 * These are first-draft values, set so that the hand-crafted path in
 * src/content/paths reads the way it is meant to. They are almost certainly
 * wrong. `npm run validate` measures what they actually produce.
 */
export const TUNING = {
  /** Energy burned per unit of resistance when acting against the tendency. */
  energyPerResistance: 1.45,

  /** The best energy ceiling any life in this build can reach. Defines 'impossible'. */
  absoluteEnergyCeiling: 100,

  /** Sleep debt is the cheapest, most insulting lever in the game. */
  energyCapPerSleepDebt: 0.45,
  energyCapPerStressLoad: 0.25,

  /**
   * Resistance at which the hard path becomes a coin flip, and the resistance
   * at which it bottoms out. Tuned so "possible but brutal" is a real band and
   * not a rounding error.
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
