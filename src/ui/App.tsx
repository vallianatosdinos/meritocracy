import { useMemo, useState } from 'react'
import { GAME, getPath } from '../content'
import { diffRuns, rewindCost, simulate, type Divergence } from '../engine'
import {
  activeBranch,
  buildTree,
  forkOff,
  initialBranches,
  pushIntent,
  runAll,
  type BranchState,
  type RowView,
} from './branches'
import { Hud } from './Hud'
import { LifeCanvas, type Focus } from './LifeCanvas'
import { RollItem } from './Roll'
import type { Zoom } from './layout'

const PATH = getPath('ten-digits')

type Phase = 'title' | 'rolling' | 'play' | 'epilogue'

const newSeed = (): number => Math.floor(Math.random() * 2 ** 30)

export const App = (): JSX.Element => {
  const [seed, setSeed] = useState(newSeed)
  const [branchState, setBranchState] = useState<BranchState>(initialBranches)
  const [phase, setPhase] = useState<Phase>('title')
  const [revealed, setRevealed] = useState(0)
  const [hindsightSpent, setHindsightSpent] = useState(0)
  const [zoom, setZoom] = useState<Zoom>('moment')
  /** Focus is a fork in a particular life, now that lives sit side by side. */
  const [focus, setFocus] = useState<Focus>({ branchId: 'b0', index: 0 })
  /** Set right after a press, so the outcome gets read before the next fork. */
  const [justResolved, setJustResolved] = useState<number | null>(null)
  const [divergences, setDivergences] = useState<Divergence[] | null>(null)

  const runs = useMemo(() => runAll(PATH, seed, branchState), [seed, branchState])
  const activeRun = runs.get(branchState.activeId)!
  const tree = useMemo(() => buildTree(PATH, runs, branchState), [runs, branchState])
  const hindsightLeft = Math.max(0, activeRun.resources.hindsight - hindsightSpent)
  const focusRun = runs.get(focus.branchId) ?? activeRun
  const focusRecord = focusRun.records[focus.index] ?? null
  const focusIsActiveLife = focus.branchId === branchState.activeId

  const reset = (): void => {
    setSeed(newSeed())
    setBranchState(initialBranches())
    setPhase('title')
    setRevealed(0)
    setHindsightSpent(0)
    setZoom('moment')
    setFocus({ branchId: 'b0', index: 0 })
    setJustResolved(null)
    setDivergences(null)
  }

  const choose = (arm: 0 | 1): void => {
    const at = activeRun.cursor
    setBranchState((s) => pushIntent(s, { optionIndex: arm }))
    setJustResolved(at)
    setFocus({ branchId: branchState.activeId, index: at })
    setZoom('moment')
    setDivergences(null)
  }

  const goOn = (): void => {
    const next = activeRun.cursor
    setJustResolved(null)
    setDivergences(null)
    if (next >= PATH.forks.length) {
      setZoom('life')
      setPhase('epilogue')
      return
    }
    setFocus({ branchId: branchState.activeId, index: next })
    setZoom('moment')
  }

  const stepBackTo = (index: number): void => {
    const cost = rewindCost(activeRun.cursor, index)
    if (cost > hindsightLeft) return
    setHindsightSpent((n) => n + cost)
    setBranchState((s) => {
      const next = forkOff(s, index)
      setFocus({ branchId: next.activeId, index })
      return next
    })
    setJustResolved(null)
    setDivergences(null)
    setZoom('moment')
    setPhase('play')
  }

  /**
   * Go back to a fork and take the other road, in one action.
   *
   * Stepping back and then pressing was two separate discoveries, and the
   * player only ever made the first one by accident. What they want is "try
   * that instead"; the engine still decides what actually happens.
   */
  const tryOther = (index: number, arm: 0 | 1): void => {
    const cost = rewindCost(activeRun.cursor, index)
    if (cost > hindsightLeft) return
    setHindsightSpent((n) => n + cost)
    setBranchState((s) => {
      const next = pushIntent(forkOff(s, index), { optionIndex: arm })
      setFocus({ branchId: next.activeId, index })
      return next
    })
    setJustResolved(index)
    setDivergences(null)
    setZoom('moment')
    setPhase('play')
  }

  /**
   * Stepping back happens within the life the player is in. A fork in a life
   * they left can be read, but branching from it again is a different mechanic
   * and is not built.
   */
  const stepBackFor = (row: RowView): { cost: number; affordable: boolean } | null => {
    if (!row.isActive || row.branchId !== branchState.activeId) return null
    if (row.index >= activeRun.cursor) return null
    const cost = rewindCost(activeRun.cursor, row.index)
    return { cost, affordable: cost <= hindsightLeft }
  }

  /**
   * The experiment: keep every later press identical, re-run, and see how
   * little of the life notices.
   */
  const pressTheSameAgain = (): void => {
    const active = activeBranch(branchState)
    const parent = branchState.branches.find((b) => b.id === active.parentId)
    if (!parent) return
    const tail = parent.intents.slice(active.intents.length)
    if (tail.length === 0) return

    const before = simulate(PATH, seed, parent.intents)
    const after = simulate(PATH, seed, [...active.intents, ...tail])
    setBranchState((s) => ({
      ...s,
      branches: s.branches.map((b) =>
        b.id === s.activeId ? { ...b, intents: [...b.intents, ...tail] } : b,
      ),
    }))
    setDivergences(diffRuns(before, after))
    setJustResolved(null)
    setZoom('life')
  }

  const sameAgainCount = (): number => {
    const active = activeBranch(branchState)
    const parent = branchState.branches.find((b) => b.id === active.parentId)
    if (!parent) return 0
    return Math.max(0, parent.intents.length - active.intents.length)
  }

  /* ------------------------------- title ------------------------------- */
  if (phase === 'title') {
    return (
      <div className="shell">
        <div className="spacer" />
        <div className="stack">
          <p className="scale-tag">{GAME.tagline}</p>
          <h1>{GAME.title}</h1>
          <p className="scale-tag">Path one &middot; {PATH.title}</p>
          <p className="sub">{PATH.anchorAct}</p>
          <p className="sub">
            You are not {PATH.character.name}. You are the thing that thinks it is
            {' '}{PATH.character.name}. Tonight there is one phone call to make, and we are going to
            find out together whether it was ever available.
          </p>
        </div>
        <div className="row">
          <button className="act primary big" onClick={() => setPhase('rolling')}>
            Roll for a life
          </button>
        </div>
        <p className="tiny">Prototype, build {__BUILD_ID__}. Life {seed}.</p>
        <div className="spacer" />
      </div>
    )
  }

  /* -------------------------------- roll ------------------------------- */
  if (phase === 'rolling') {
    const done = revealed >= activeRun.roll.length
    return (
      <div className="shell scroller">
        <div className="topbar">
          <span>before she starts</span>
          <span className="when">nothing below was chosen</span>
        </div>
        <div>
          {activeRun.roll.slice(0, revealed).map((r) => (
            <RollItem key={r.categoryId} record={r} />
          ))}
        </div>
        <div className="row">
          {!done ? (
            <button className="act primary big" onClick={() => setRevealed((n) => n + 1)}>
              {revealed === 0 ? 'Roll' : 'Roll again'}
            </button>
          ) : (
            <button className="act primary big" onClick={() => setPhase('play')}>
              Start her life
            </button>
          )}
          {revealed > 0 && !done && (
            <span className="tiny" style={{ alignSelf: 'center' }}>
              {activeRun.roll.length - revealed} left
            </span>
          )}
        </div>
        {done && (
          <p className="tiny">
            You cannot re-roll. Everything above is now load-bearing.
          </p>
        )}
        <div className="spacer" />
      </div>
    )
  }

  /* ------------------------- play and epilogue ------------------------- */
  const resolvedRecord = justResolved !== null ? activeRun.records[justResolved] ?? null : null
  const focusedFork = PATH.forks[focus.index]
  const canStepBack =
    focusRecord !== null && focusIsActiveLife && focus.index < activeRun.cursor
  const stepCost = canStepBack ? rewindCost(activeRun.cursor, focus.index) : 0
  const sameAgain = sameAgainCount()

  return (
    <div className="stage">
      <Hud
        resources={activeRun.resources}
        hindsightLeft={hindsightLeft}
        zoom={zoom}
        onZoom={(z) => setZoom(z)}
      />

      <LifeCanvas
        path={PATH}
        tree={tree}
        runs={runs}
        activeId={branchState.activeId}
        zoom={zoom}
        focus={focus}
        onChoose={choose}
        onTryOther={tryOther}
        stepBackFor={stepBackFor}
        onFocus={(f) => {
          setFocus(f)
          // Zooming in on every tap would make the map unusable for browsing.
          // Life distance stays put; the closer framings inspect what you tapped.
          if (zoom === 'life') setZoom('near')
        }}
      />

      <div className="sheet">
        {divergences !== null && (
          <div className="sheet-block">
            <h4>You pressed the same buttons</h4>
            {divergences.length === 0 ? (
              <p>
                Nothing downstream came out differently. The edit was real and the life absorbed it
                without comment.
              </p>
            ) : (
              <p>
                {divergences.length} {divergences.length === 1 ? 'thing' : 'things'} came out
                differently, and you changed none of your inputs after the edit. They are lit on the
                canvas.
              </p>
            )}
          </div>
        )}

        {/*
          * At life distance the player is navigating, not reading. Holding the
          * narration here would cover the half of the canvas they zoomed out to
          * see.
          */}
        {resolvedRecord && zoom !== 'life' && (
          <div className="sheet-block">
            <p className="narration">{resolvedRecord.narration}</p>
            {resolvedRecord.confabulated && (
              <div className="confab">
                <h4>
                  {resolvedRecord.outcome === 'blocked'
                    ? 'She was never going to'
                    : 'She explains it to herself'}
                </h4>
                <p>{resolvedRecord.confabulation}</p>
              </div>
            )}
            {resolvedRecord.fork.aside && <p className="aside">{resolvedRecord.fork.aside}</p>}
          </div>
        )}

        {phase === 'epilogue' && (
          <div className="sheet-block">
            <p className="narration">
              {activeRun.anchor?.taken
                ? PATH.epilogue.onAnchorTaken
                : PATH.epilogue.onAnchorRefused}
            </p>
            <p className="coda">{PATH.epilogue.coda}</p>
          </div>
        )}

        {!resolvedRecord && phase === 'play' && zoom === 'moment' && focusIsActiveLife &&
          focus.index === activeRun.cursor && focusedFork && (
            <p className="hint">{focusedFork.when} &mdash; two ways out. Pick one.</p>
          )}

        {canStepBack && focusedFork && (
          <div className="sheet-block">
            <p className="hint">
              {focusedFork.when} &mdash; {focusRecord.fork.options[focusRecord.resolvedIndex].label}
              {zoom !== 'life' && <> &middot; the other road is dashed, beside it</>}
            </p>
          </div>
        )}

        {!canStepBack && phase === 'play' && activeRun.cursor > 0 && justResolved === null &&
          focusIsActiveLife && focus.index === activeRun.cursor && (
            <p className="hint">Tap anything behind her to look at why, and to go back to it.</p>
          )}

        <div className="row">
          {resolvedRecord && (
            <button className="act primary" onClick={goOn}>
              {activeRun.cursor >= PATH.forks.length ? 'After' : 'Go on'}
            </button>
          )}
          {canStepBack && (
            <button
              className="act primary"
              disabled={stepCost > hindsightLeft}
              onClick={() => stepBackTo(focus.index)}
            >
              {stepCost > hindsightLeft
                ? `Needs ${stepCost} hindsight`
                : `Go back to this · ${stepCost}`}
            </button>
          )}
          {sameAgain > 0 && (
            <button className="act" onClick={pressTheSameAgain}>
              Press the same {sameAgain} again
            </button>
          )}
          {!resolvedRecord &&
            !(focusIsActiveLife && focus.index === activeRun.cursor) &&
            phase === 'play' && (
            <button
              className="act"
              onClick={() => {
                setFocus({ branchId: branchState.activeId, index: activeRun.cursor })
                setZoom('moment')
              }}
            >
              Back to her
            </button>
          )}
          {phase === 'epilogue' && (
            <button className="act primary" onClick={reset}>
              Another life
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
