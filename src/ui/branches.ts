import {
  simulate,
  type ForkRecord,
  type Intent,
  type LifePath,
  type RunResult,
} from '../engine'

/**
 * Branch bookkeeping.
 *
 * Deliberately UI-side: the engine already makes a life a pure function of
 * (path, seed, intents), so "a parallel path the player stepped out of" is just
 * another intent list. No engine change is needed to remember them, and none is
 * made.
 */
export interface Branch {
  id: string
  intents: Intent[]
  /** Fork index at which this branch left its parent. null for the first one. */
  divergedAt: number | null
  /** The life this one was stepped out of. */
  parentId: string | null
}

export interface BranchState {
  branches: Branch[]
  activeId: string
}

export const initialBranches = (): BranchState => ({
  branches: [{ id: 'b0', intents: [], divergedAt: null, parentId: null }],
  activeId: 'b0',
})

export const activeBranch = (s: BranchState): Branch => {
  const b = s.branches.find((x) => x.id === s.activeId)
  if (!b) throw new Error('no active branch')
  return b
}

export const pushIntent = (s: BranchState, intent: Intent): BranchState => ({
  ...s,
  branches: s.branches.map((b) =>
    b.id === s.activeId ? { ...b, intents: [...b.intents, intent] } : b,
  ),
})

/**
 * Step back to a fork. The life being left is kept whole, as a parallel path:
 * it stays on the canvas, dimmed, running on past the point the player
 * abandoned it.
 */
export const forkOff = (s: BranchState, atIndex: number): BranchState => {
  const current = activeBranch(s)
  const id = `b${s.branches.length}`
  return {
    branches: [
      ...s.branches,
      { id, intents: current.intents.slice(0, atIndex), divergedAt: atIndex, parentId: current.id },
    ],
    activeId: id,
  }
}

/** Replay every branch. Cheap: a life is sixteen forks of arithmetic. */
export const runAll = (path: LifePath, seed: number, s: BranchState): Map<string, RunResult> =>
  new Map(s.branches.map((b) => [b.id, simulate(path, seed, b.intents)]))

/* ------------------------------------------------------------------ *
 * The tree, as rows to draw.
 *
 * Each branch owns a lane and keeps it. A branch's rows before it diverged are
 * not drawn -- they are literally the parent's rows, the same intents on the
 * same seed -- so shared history is drawn once and the tree splits exactly
 * where the lives did.
 * ------------------------------------------------------------------ */

export interface RowView {
  key: string
  branchId: string
  index: number
  lane: number
  /** Lane the incoming line arrives from. Differs only on a branch's first row. */
  fromLane: number
  record: ForkRecord | null
  /** The undecided fork at the head of the life the player is in. */
  isOpen: boolean
  /** On the path the player is currently living, as opposed to one they left. */
  isActive: boolean
  /** Only one lane draws the time-and-place card for a row. */
  drawStem: boolean
  /**
   * Set on a branch's first row when she did the same thing anyway.
   *
   * Going back and pressing the other arm always starts a new life, but the
   * press can fail or never have been in reach -- and then the new life is the
   * old life, running in its own lane. That is the purest statement the game
   * makes, and it is unreadable unless it is said out loud.
   */
  sameAsParent: boolean
}

export interface Tree {
  rows: RowView[]
  lanes: number
  rowCount: number
  laneOf: Map<string, number>
}

/**
 * Which rows are on the life the player is in.
 *
 * The active life is not one branch: it is the chain from the root down to the
 * active branch, and it occupies each ancestor only up to the point the chain
 * left it. Shared history therefore stays lit all the way back to birth, and
 * the abandoned continuations below each split go cold.
 */
const activeLineage = (s: BranchState): Map<string, number> => {
  const byId = new Map(s.branches.map((b) => [b.id, b]))
  const bound = new Map<string, number>()
  let cur = byId.get(s.activeId)
  bound.set(s.activeId, Number.POSITIVE_INFINITY)
  while (cur?.parentId) {
    const parent = byId.get(cur.parentId)
    if (!parent) break
    bound.set(parent.id, cur.divergedAt ?? 0)
    cur = parent
  }
  return bound
}

export const buildTree = (path: LifePath, runs: Map<string, RunResult>, s: BranchState): Tree => {
  const laneOf = new Map(s.branches.map((b, i) => [b.id, i]))
  const lineage = activeLineage(s)
  const rows: RowView[] = []
  let rowCount = 1

  for (const b of s.branches) {
    const run = runs.get(b.id)
    const lane = laneOf.get(b.id)
    if (!run || lane === undefined) continue
    const from = b.divergedAt ?? 0
    const parentLane = b.parentId !== null ? (laneOf.get(b.parentId) ?? lane) : lane
    const activeBound = lineage.get(b.id) ?? -1

    const parentRun = b.parentId !== null ? runs.get(b.parentId) : undefined

    for (let i = from; i < run.records.length; i++) {
      const record = run.records[i]
      if (!record) continue
      const parentRecord = i === from ? parentRun?.records[i] : undefined
      rows.push({
        key: `${b.id}:${i}`,
        branchId: b.id,
        index: i,
        lane,
        fromLane: i === from ? parentLane : lane,
        record,
        isOpen: false,
        isActive: i < activeBound,
        drawStem: i !== from || b.parentId === null,
        sameAsParent:
          parentRecord !== undefined && parentRecord.resolvedIndex === record.resolvedIndex,
      })
      rowCount = Math.max(rowCount, i + 1)
    }

    // Only the life the player is in shows its undecided fork. The head of a
    // life they walked away from is a road nobody has been down.
    if (b.id === s.activeId && run.cursor < path.forks.length) {
      rows.push({
        key: `${b.id}:${run.cursor}:open`,
        branchId: b.id,
        index: run.cursor,
        lane,
        fromLane: run.cursor === from ? parentLane : lane,
        record: null,
        isOpen: true,
        isActive: true,
        drawStem: run.cursor !== from || b.parentId === null,
        sameAsParent: false,
      })
      rowCount = Math.max(rowCount, run.cursor + 1)
    }
  }

  return { rows, lanes: s.branches.length, rowCount, laneOf }
}
