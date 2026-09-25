import {
  peek,
  simulate,
  TRAITS,
  type ForkAppraisal,
  type ForkRecord,
  type Intent,
  type LifePath,
  type RunResult,
  type TraitId,
} from '../engine'
import { activeHead, exploredKeys, type Exploration } from './explore'

export interface ArmView {
  arm: 0 | 1
  childKey: string
  /** Somebody has pressed this answer here. */
  played: boolean
  /** What happened when they did. The child's record at this depth. */
  record: ForkRecord | null
  /** The active life went this way. */
  onActivePath: boolean
}

export type Measure = TraitId | 'energy'

export interface NodeView {
  key: string
  depth: number
  parentKey: string | null
  /** Past the last question: a finished life. */
  isEnd: boolean
  /** Some life is standing here, with the question unanswered. */
  isHead: boolean
  isActiveHead: boolean
  onActivePath: boolean
  run: RunResult
  /** The question's appraisal from this node's history. null past the end. */
  appraisal: ForkAppraisal | null
  arms: [ArmView, ArmView] | null
  anyPlayed: boolean
  /** How she got here: the parent's resolution of the answer leading here. */
  arrival: ForkRecord | null
  values: Record<Measure, number>
  energyCap: number
  /** Horizontal slot from packing the tree. */
  slot: number
}

export interface RowView {
  depth: number
  keys: string[]
  /** Where the row's question is shown: the node on the active path, or the first. */
  anchorKey: string
  /** What differs between the forks in this row. Empty with only one fork. */
  differs: Set<Measure>
  /** The fork the others are compared against. null with only one fork. */
  referenceKey: string | null
}

export interface GraphModel {
  nodes: Map<string, NodeView>
  rows: RowView[]
  slots: number
  activeKey: string
}

const intentsOf = (key: string): Intent[] =>
  [...key].map((c) => ({ optionIndex: c === '0' ? 0 : 1 }) as Intent)

export const MEASURES: Measure[] = [...TRAITS, 'energy']

/**
 * Build what the screen shows.
 *
 * Only explored nodes are drawn. Every fork still shows both of its answers --
 * an unpressed one is a button, not a node -- so each row doubles exactly as
 * far as the player has pushed it.
 */
export const buildGraph = (
  path: LifePath,
  seed: number,
  e: Exploration,
  cache: Map<string, RunResult>,
): GraphModel => {
  const runOf = (key: string): RunResult => {
    const hit = cache.get(key)
    if (hit) return hit
    const run = simulate(path, seed, intentsOf(key))
    cache.set(key, run)
    return run
  }

  const last = path.forks.length
  const active = activeHead(e)
  const explored = exploredKeys(e)
  const heads = new Set(e.heads)
  const nodes = new Map<string, NodeView>()

  for (const key of explored) {
    const depth = key.length
    if (depth > last) continue
    const run = runOf(key)
    const isEnd = depth === last

    const arms = isEnd
      ? null
      : (([0, 1] as const).map((arm) => {
          const childKey = key + arm
          const played = explored.has(childKey)
          return {
            arm,
            childKey,
            played,
            record: played ? (runOf(childKey).records[depth] ?? null) : null,
            onActivePath: active.startsWith(childKey),
          }
        }) as [ArmView, ArmView])

    const values = {} as Record<Measure, number>
    for (const t of TRAITS) values[t] = Math.round(run.traits[t].value)
    values.energy = run.resources.energy

    nodes.set(key, {
      key,
      depth,
      parentKey: depth === 0 ? null : key.slice(0, -1),
      isEnd,
      isHead: heads.has(key) && !isEnd,
      isActiveHead: key === active,
      onActivePath: active.startsWith(key),
      run,
      appraisal: isEnd ? null : (peek(run)?.appraisal ?? null),
      arms,
      anyPlayed: arms?.some((a) => a.played) ?? false,
      arrival: depth === 0 ? null : (run.records[depth - 1] ?? null),
      values,
      energyCap: run.resources.energyCap,
      slot: 0,
    })
  }

  // Pack: leaves take consecutive slots, parents centre over their children.
  let next = 0
  const place = (key: string): number => {
    const n = nodes.get(key)
    if (!n) return next
    const kids = (n.arms ?? []).filter((a) => a.played && nodes.has(a.childKey))
    if (kids.length === 0) {
      n.slot = next++
      return n.slot
    }
    const xs = kids.map((a) => place(a.childKey))
    n.slot = (Math.min(...xs) + Math.max(...xs)) / 2
    return n.slot
  }
  place('')

  const byDepth = new Map<number, string[]>()
  for (const n of nodes.values()) {
    const arr = byDepth.get(n.depth) ?? []
    arr.push(n.key)
    byDepth.set(n.depth, arr)
  }

  const rows: RowView[] = [...byDepth.entries()]
    .sort(([a], [b]) => a - b)
    .map(([depth, keys]) => {
      keys.sort((a, b) => (nodes.get(a)?.slot ?? 0) - (nodes.get(b)?.slot ?? 0))
      const anchorKey = keys.find((k) => active.startsWith(k)) ?? keys[0] ?? ''
      const differs = new Set<Measure>()
      if (keys.length > 1) {
        for (const m of MEASURES) {
          const vs = keys.map((k) => nodes.get(k)?.values[m] ?? 0)
          if (Math.max(...vs) - Math.min(...vs) >= 1) differs.add(m)
        }
      }
      return { depth, keys, anchorKey, differs, referenceKey: keys.length > 1 ? anchorKey : null }
    })

  return { nodes, rows, slots: Math.max(1, next), activeKey: active }
}
