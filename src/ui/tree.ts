import { peek, simulate, type Intent, type LifePath, type RunResult } from '../engine'
import type { BranchState } from './branches'

/**
 * The tree of answers.
 *
 * The root is the first fork. Every fork spawns two, so row N holds instances
 * of fork N -- the same question, reached from a different sequence of previous
 * answers, and therefore facing a different person with a different tendency
 * and a different price. That repetition is the argument.
 *
 * A node is identified by the answers that got to it: "011" is fork 3, reached
 * by pressing 0, then 1, then 1. The tree branches on what the PLAYER PRESSED,
 * not on what happened, which keeps it exactly binary -- and makes the cases
 * where two different presses land in the same state visible as two branches
 * arriving at the same result.
 *
 * The full tree is 2^16 leaves and nobody will ever see most of it. Drawn are
 * the nodes somebody has lived, plus the unpressed sibling of each -- so the
 * shape widens as it is explored and every unexplored answer is on screen as
 * something to tap.
 */
export type NodeKind =
  /** Somebody has been here. */
  | 'lived'
  /** An answer nobody has pressed. Tap to go back and press it. */
  | 'stub'

export interface TreeNode {
  key: string
  intents: Intent[]
  /** Depth is the fork index: a node at depth d IS fork d. */
  depth: number
  parentKey: string | null
  /** Which answer at the parent leads here. */
  armFromParent: 0 | 1 | null
  kind: NodeKind
  /** Child key per answer. null where that answer has no node at all. */
  children: [string | null, string | null]
  /** Horizontal slot, from packing the drawn tree. */
  x: number
  /** On the life the player is living now. */
  onActivePath: boolean
  /** The fork the active life is facing: its two answers are live. */
  isCurrent: boolean
}

export interface Tree {
  nodes: Map<string, TreeNode>
  rootKey: string
  /** Slots wide, for canvas sizing. */
  slots: number
  /** Deepest row drawn, plus one. */
  rows: number
}

const keyOf = (intents: readonly Intent[]): string =>
  intents.map((i) => i.optionIndex).join('')

const intentsFromKey = (key: string): Intent[] =>
  [...key].map((c) => ({ optionIndex: c === '0' ? 0 : 1 }) as Intent)

export const buildTree = (path: LifePath, state: BranchState): Tree => {
  const maxDepth = path.forks.length

  // Every prefix of every life that has been lived, including the empty one.
  const lived = new Set<string>()
  for (const b of state.branches) {
    for (let l = 0; l <= b.intents.length; l++) lived.add(keyOf(b.intents.slice(0, l)))
  }

  const active = state.branches.find((b) => b.id === state.activeId)
  const activeKey = active ? keyOf(active.intents) : ''
  const onActive = new Set<string>()
  for (let l = 0; l <= activeKey.length; l++) onActive.add(activeKey.slice(0, l))

  const nodes = new Map<string, TreeNode>()

  const makeNode = (key: string, kind: NodeKind): TreeNode => ({
    key,
    intents: intentsFromKey(key),
    depth: key.length,
    parentKey: key.length === 0 ? null : key.slice(0, -1),
    armFromParent: key.length === 0 ? null : ((key.slice(-1) === '0' ? 0 : 1) as 0 | 1),
    kind,
    children: [null, null],
    x: 0,
    onActivePath: onActive.has(key),
    isCurrent: kind === 'lived' && key === activeKey,
  })

  for (const key of lived) {
    if (key.length > maxDepth) continue
    nodes.set(key, makeNode(key, 'lived'))
  }

  /*
   * Every fork spawns two.
   *
   * A node sprouts both children when somebody has answered it -- the pressed
   * one is lived, the other is a stub waiting to be explored -- and also when it
   * is the question the active life is facing, where both children are the live
   * options. A node that is neither (the head of a life the player walked away
   * from) sprouts nothing: nobody is standing there to answer.
   */
  for (const node of [...nodes.values()]) {
    if (node.depth >= maxDepth) continue
    const childKeys: [string, string] = [`${node.key}0`, `${node.key}1`]
    const answered = childKeys.some((k) => lived.has(k))
    if (!answered && !node.isCurrent) continue
    for (const arm of [0, 1] as const) {
      const ck = childKeys[arm]
      node.children[arm] = ck
      if (!nodes.has(ck)) nodes.set(ck, makeNode(ck, 'stub'))
    }
  }

  /* Pack the drawn tree: leaves take consecutive slots, parents centre on
     their children. Keeps siblings apart and makes the shape widen downward. */
  let slot = 0
  const place = (key: string): number => {
    const n = nodes.get(key)
    if (!n) return slot
    const kids = n.children.filter((k): k is string => k !== null && nodes.has(k))
    if (kids.length === 0) {
      n.x = slot
      slot += 1
      return n.x
    }
    const xs = kids.map(place)
    n.x = (Math.min(...xs) + Math.max(...xs)) / 2
    return n.x
  }
  place('')

  let rows = 1
  for (const n of nodes.values()) rows = Math.max(rows, n.depth + 1)

  return { nodes, rootKey: '', slots: Math.max(1, slot), rows }
}

/** A node's life, replayed from its answers. Cheap, and memoised by caller. */
export const runFor = (
  path: LifePath,
  seed: number,
  node: TreeNode,
  cache: Map<string, RunResult>,
): RunResult => {
  const hit = cache.get(node.key)
  if (hit) return hit
  const run = simulate(path, seed, node.intents)
  cache.set(node.key, run)
  return run
}

export interface EdgeFacts {
  arm: 0 | 1
  child: TreeNode
  /** Appraised from THIS node's history: what pressing that answer would cost. */
  cost: number
  feasibility: 'affordable' | 'out-of-reach' | 'impossible'
  isTendency: boolean
  /** Where the answer actually led, once somebody pressed it. */
  resolvedIndex: 0 | 1 | null
  /** Pressed one thing, did the other. */
  confabulated: boolean
}

/**
 * Read one answer out of a node: its price here, and where it actually led.
 *
 * The price comes from this node's own history -- the same question costs a
 * different amount depending on who arrives at it, which is the whole reason
 * the tree repeats the question instead of collapsing it.
 */
export const edgeFacts = (
  path: LifePath,
  seed: number,
  tree: Tree,
  node: TreeNode,
  arm: 0 | 1,
  cache: Map<string, RunResult>,
): EdgeFacts | null => {
  const childKey = node.children[arm]
  const child = childKey === null ? undefined : tree.nodes.get(childKey)
  if (!child) return null

  const look = peek(runFor(path, seed, node, cache))
  if (!look) return null
  const opt = look.appraisal.options[arm]

  let resolvedIndex: 0 | 1 | null = null
  if (child.kind === 'lived') {
    const rec = runFor(path, seed, child, cache).records[node.depth]
    if (rec) resolvedIndex = rec.resolvedIndex
  }

  return {
    arm,
    child,
    cost: opt.energyCost,
    feasibility: opt.feasibility,
    isTendency: opt.isTendency,
    resolvedIndex,
    confabulated: resolvedIndex !== null && resolvedIndex !== arm,
  }
}

/** The appraisal of the question at a node, for splitting pulls onto answers. */
export const appraisalAt = (
  path: LifePath,
  seed: number,
  node: TreeNode,
  cache: Map<string, RunResult>,
) => peek(runFor(path, seed, node, cache))?.appraisal ?? null
