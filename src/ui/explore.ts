import { rewindCost } from '../engine'

/**
 * What the player has explored.
 *
 * A node of the tree is named by the answers that reached it: "011" is the
 * fourth question, arrived at by pressing 0, then 1, then 1. Every life the
 * player has lived ends at a head -- the question it is standing at now -- and
 * every node on the way to any head has been lived.
 *
 * There is exactly one active life at a time: the most recent head. Its path
 * from the root to "now" is the active path.
 */
export interface Exploration {
  /** Heads of every life lived, least recent first. The last is the active one. */
  heads: string[]
  hindsightSpent: number
}

export const initialExploration = (): Exploration => ({ heads: [''], hindsightSpent: 0 })

export const activeHead = (e: Exploration): string => e.heads[e.heads.length - 1] ?? ''

/** Every node somebody has stood at: all prefixes of all heads. */
export const exploredKeys = (e: Exploration): Set<string> => {
  const out = new Set<string>()
  for (const h of e.heads) for (let l = 0; l <= h.length; l++) out.add(h.slice(0, l))
  return out
}

/**
 * Where a node leads, when the player walks down from it.
 *
 * A node can have been left in two directions. The canonical way on is the
 * life most recently lived through it -- which, for any node on the active
 * path, is the active life itself.
 */
export const continuation = (e: Exploration, key: string): string | null => {
  for (let i = e.heads.length - 1; i >= 0; i--) {
    const h = e.heads[i]
    if (h !== undefined && h.startsWith(key)) return h
  }
  return null
}

export type PressResult =
  /** A life answered the question it was standing at, or a new one began. */
  | { kind: 'played'; next: Exploration; cost: number }
  /** Somebody already pressed that answer; the player moved into that life. */
  | { kind: 'switched'; next: Exploration }
  /** Going back that far costs more hindsight than is left. */
  | { kind: 'refused'; cost: number }

/** What pressing an answer would cost in hindsight, without pressing it. */
export const pressCost = (e: Exploration, nodeKey: string, arm: 0 | 1): number => {
  const explored = exploredKeys(e)
  if (e.heads.includes(nodeKey) || explored.has(nodeKey + arm)) return 0
  return rewindCost(activeHead(e).length, nodeKey.length)
}

/**
 * Press an answer anywhere on the tree.
 *
 * Three cases, and only one of them costs anything:
 *  - the node is where some life is standing: that life answers and moves on;
 *  - the answer was pressed before: the player steps into that life;
 *  - the answer was never pressed, somewhere behind a life: going back in
 *    time, paid for in hindsight.
 */
export const press = (
  e: Exploration,
  nodeKey: string,
  arm: 0 | 1,
  hindsightTotal: number,
): PressResult => {
  const child = nodeKey + arm

  const at = e.heads.indexOf(nodeKey)
  if (at >= 0) {
    return {
      kind: 'played',
      next: { ...e, heads: [...e.heads.filter((_, i) => i !== at), child] },
      cost: 0,
    }
  }

  if (exploredKeys(e).has(child)) {
    const target = continuation(e, child) ?? child
    return { kind: 'switched', next: { ...e, heads: [...e.heads.filter((h) => h !== target), target] } }
  }

  const cost = rewindCost(activeHead(e).length, nodeKey.length)
  if (e.hindsightSpent + cost > hindsightTotal) return { kind: 'refused', cost }
  return {
    kind: 'played',
    next: { heads: [...e.heads, child], hindsightSpent: e.hindsightSpent + cost },
    cost,
  }
}
