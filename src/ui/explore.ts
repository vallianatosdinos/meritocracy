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
 *
 * What was pressed is kept apart from where it led. A press that could not
 * change anything about her -- an answer never in reach, so she did the other
 * one and arrived exactly as if that had been pressed -- leads to the same node
 * as the other answer. The press is still remembered and shown; the tree just
 * does not pretend it opened a second life.
 */
export interface Exploration {
  /** Heads of every life lived, least recent first. The last is the active one. */
  heads: string[]
  /** Every answer pressed, as node key + arm, least recent first. */
  presses: string[]
}

export const initialExploration = (): Exploration => ({ heads: [''], presses: [] })

/** Where pressing an answer leads: the node key of the fork it arrives at. */
export type Canon = (nodeKey: string, arm: 0 | 1) => string

/** Without a canon, every press opens its own branch. */
export const literal: Canon = (nodeKey, arm) => nodeKey + arm

/** An exploration reached by pressing straight down to each of these heads. */
export const fromHeads = (heads: string[]): Exploration => {
  const presses = new Set<string>()
  for (const h of heads) for (let l = 1; l <= h.length; l++) presses.add(h.slice(0, l))
  return { heads, presses: [...presses] }
}

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
  | { kind: 'played'; next: Exploration }
  /** Somebody already pressed that answer; the player moved into that life. */
  | { kind: 'switched'; next: Exploration }

/**
 * Press an answer anywhere on the tree.
 *
 * Three cases, and none of them costs anything. Going back is free on purpose:
 * the game wants the player comparing paths, not rationing them.
 *  - where it leads was reached before: the player steps into that life (and
 *    a life standing here moves on into it);
 *  - the node is where some life is standing: that life answers and moves on;
 *  - otherwise, somewhere behind a life: going back in time, and a new path
 *    starts there.
 */
export const press = (
  e: Exploration,
  nodeKey: string,
  arm: 0 | 1,
  canon: Canon = literal,
): PressResult => {
  const child = canon(nodeKey, arm)
  const pressed = nodeKey + arm
  const presses = [...e.presses.filter((p) => p !== pressed), pressed]
  const others = e.heads.filter((h) => h !== nodeKey)

  if (exploredKeys(e).has(child)) {
    const target = continuation(e, child) ?? child
    const wasHead = e.heads.includes(nodeKey)
    return {
      kind: wasHead ? 'played' : 'switched',
      next: { heads: [...others.filter((h) => h !== target), target], presses },
    }
  }

  const heads = e.heads.includes(nodeKey) ? others : e.heads
  return { kind: 'played', next: { heads: [...heads, child], presses } }
}
