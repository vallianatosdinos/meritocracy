import { simulate, type Intent, type LifePath, type RunResult } from '../engine'

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

export type ArmState =
  /** The life the player is in went this way. */
  | 'active'
  /** A life the player has lived and stepped out of went this way. */
  | 'parallel'
  /** The fork in front of them. Neither arm taken yet. */
  | 'open'
  /** Nobody has ever been here. Not drawn. */
  | 'unlived'

export interface ArmFacts {
  state: ArmState
  /** True when the player pressed this arm and the character did something else. */
  pressedButNotTaken: boolean
}

export interface ForkFacts {
  index: number
  arms: [ArmFacts, ArmFacts]
  /** Any arm visible at all. */
  visible: boolean
  /** This is the fork awaiting a decision on the active path. */
  isCurrent: boolean
}

/**
 * Fold every branch into per-fork, per-arm visibility.
 *
 * The four states in the brief fall out of two questions asked of each arm:
 * has anyone been down it, and is the life the player is in down it now.
 */
export const readForks = (
  path: LifePath,
  runs: Map<string, RunResult>,
  activeId: string,
): ForkFacts[] => {
  const active = runs.get(activeId)
  if (!active) throw new Error('active run missing')

  return path.forks.map((_, index) => {
    const isCurrent = index === active.cursor
    const arms: [ArmFacts, ArmFacts] = [
      { state: 'unlived', pressedButNotTaken: false },
      { state: 'unlived', pressedButNotTaken: false },
    ]

    for (const [id, run] of runs) {
      const rec = run.records[index]
      if (!rec) continue
      const arm = arms[rec.resolvedIndex]
      if (id === activeId) {
        arm.state = 'active'
        if (rec.confabulated) arms[rec.intent.optionIndex].pressedButNotTaken = true
      } else if (arm.state !== 'active') {
        arm.state = 'parallel'
      }
    }

    if (isCurrent) {
      for (const arm of arms) if (arm.state === 'unlived') arm.state = 'open'
    }

    return {
      index,
      arms,
      isCurrent,
      visible: arms.some((a) => a.state !== 'unlived'),
    }
  })
}
