/**
 * Seeded RNG. The engine must be deterministic given (seed, player inputs) so
 * that (a) a rewind reproduces the same life up to the edit point, and
 * (b) scripts/validate.ts can run a path ten thousand times and get a stable
 * distribution to check against.
 *
 * mulberry32 -- small, fast, good enough, no dependency.
 */
export interface Rng {
  next(): number
  int(maxExclusive: number): number
  pick<T>(xs: readonly T[]): T
  fork(tag: string): Rng
  readonly seed: number
}

const hashString = (s: string): number => {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const makeRng = (seed: number | string): Rng => {
  const numericSeed = typeof seed === 'number' ? seed >>> 0 : hashString(seed)
  let a = numericSeed
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    seed: numericSeed,
    next,
    int: (maxExclusive: number) => Math.floor(next() * maxExclusive),
    pick: <T,>(xs: readonly T[]): T => {
      const item = xs[Math.floor(next() * xs.length)]
      if (item === undefined) throw new Error('pick() from empty array')
      return item
    },
    /**
     * Derive an independent stream. Used so that, e.g., the choreography roll
     * at fork 12 does not shift just because an earlier fork consumed a
     * different number of random draws -- a rewind should change what it
     * actually changes, not reshuffle the universe.
     */
    fork: (tag: string) => makeRng(numericSeed ^ hashString(tag)),
  }
}
