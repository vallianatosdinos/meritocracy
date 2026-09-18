import { TUNING, type Contribution, type ForkAppraisal } from '../engine'

/**
 * Split the receipt onto the two arms.
 *
 * The engine produces one signed list: positive pulls toward options[0],
 * negative toward options[1]. A flat list makes that a table to be read; put
 * each cause on the arm it pulls toward and it becomes a picture of the
 * decision being made. Same numbers, and they still sum to the leaning.
 */
export interface ArmPull {
  /** Always positive here -- magnitude of everything pulling this way. */
  total: number
  items: Contribution[]
  /** Count and sum of rows too small to list. */
  folded: { count: number; sum: number }
}

export const splitPulls = (appraisal: ForkAppraisal): [ArmPull, ArmPull] => {
  const make = (): ArmPull => ({ total: 0, items: [], folded: { count: 0, sum: 0 } })
  const out: [ArmPull, ArmPull] = [make(), make()]

  /**
   * One fact can argue twice -- once through a trait it shaped, once through a
   * tag the fork weighs directly. Both are real, but printing the same sentence
   * on two lines reads as a bug rather than as two channels, so they are summed
   * back into the single fact they came from.
   */
  const merged: [Map<string, Contribution>, Map<string, Contribution>] = [new Map(), new Map()]

  for (const c of appraisal.contributions) {
    if (c.weight === 0) continue
    const side = c.weight > 0 ? 0 : 1
    out[side].total += Math.abs(c.weight)
    const key = c.factorId ?? `${c.scale}:${c.label}`
    const seen = merged[side].get(key)
    if (seen) seen.weight += c.weight
    else merged[side].set(key, { ...c })
  }

  for (const side of [0, 1] as const) {
    for (const c of merged[side].values()) {
      const mag = Math.abs(c.weight)
      if (mag >= TUNING.receiptNoiseFloor) out[side].items.push(c)
      else {
        out[side].folded.count += 1
        out[side].folded.sum += mag
      }
    }
  }
  return out
}

/** Share of the fork's total pull that this arm holds, for a bar. */
export const pullShare = (pulls: [ArmPull, ArmPull], arm: 0 | 1): number => {
  const sum = pulls[0].total + pulls[1].total
  return sum === 0 ? 0.5 : pulls[arm].total / sum
}
