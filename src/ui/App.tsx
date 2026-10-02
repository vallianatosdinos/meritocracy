import { useMemo, useState } from 'react'
import { GAME, getPath } from '../content'
import { SCALE_NAMES, simulate, type RunResult } from '../engine'
import {
  activeHead,
  continuation,
  initialExploration,
  press,
  type Exploration,
} from './explore'
import { Graph, type ScrollRequest } from './Graph'
import { buildGraph } from './graph'
import { Hud } from './Hud'
import { RollItem } from './Roll'

const PATH = getPath('ten-digits')

type Phase = 'title' | 'rolling' | 'play'

const newSeed = (): number => Math.floor(Math.random() * 2 ** 30)

export const App = (): JSX.Element => {
  const [seed, setSeed] = useState(newSeed)
  const [phase, setPhase] = useState<Phase>('title')
  const [revealed, setRevealed] = useState(0)
  const [exploration, setExploration] = useState<Exploration>(initialExploration)
  const [focusKey, setFocusKey] = useState('')
  const [scrollReq, setScrollReq] = useState<ScrollRequest>({ key: '', mode: 'focus', nonce: 0 })

  const cache = useMemo(() => new Map<string, RunResult>(), [seed])
  const model = useMemo(
    () => buildGraph(PATH, seed, exploration, cache),
    [seed, exploration, cache],
  )
  const root = useMemo(() => simulate(PATH, seed, []), [seed])

  const go = (key: string, mode: ScrollRequest['mode'] = 'focus'): void => {
    setFocusKey(key)
    setScrollReq((r) => ({ key, mode, nonce: r.nonce + 1 }))
  }

  const reset = (): void => {
    setSeed(newSeed())
    setPhase('title')
    setRevealed(0)
    setExploration(initialExploration())
    setFocusKey('')
    setScrollReq({ key: '', mode: 'focus', nonce: 0 })
  }

  /**
   * One press, no confirmations.
   *
   * The result, the receipt and the other answer are all on the same card, so
   * the player stays at this question and sees what happened. An answer already
   * on the active path is a way down instead: pressing it again walks there.
   */
  const onPress = (nodeKey: string, arm: 0 | 1): void => {
    const node = model.nodes.get(nodeKey)
    const a = node?.arms?.[arm]
    if (a?.played && a.onActivePath) {
      go(a.childKey)
      return
    }
    setExploration(press(exploration, nodeKey, arm).next)
    go(nodeKey, 'reveal')
  }

  /* ------------------------------- title ------------------------------- */
  if (phase === 'title') {
    return (
      <div className="shell">
        <div className="spacer" />
        <div className="stack">
          <p className="scale-tag">{GAME.tagline}</p>
          <h1>{GAME.title}</h1>
          <p className="scale-tag">Life one &middot; {PATH.title}</p>
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
    const done = revealed >= root.roll.length
    return (
      <div className="shell scroller">
        <div className="topbar">
          <span>before she starts</span>
          <span className="when">nothing below was chosen</span>
        </div>
        <div>
          {root.roll.slice(0, revealed).map((r) => (
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
              {root.roll.length - revealed} left
            </span>
          )}
        </div>
        {done && <p className="tiny">You cannot re-roll. Everything above is now load-bearing.</p>}
        <div className="spacer" />
      </div>
    )
  }

  /* -------------------------------- play ------------------------------- */
  const focus = model.nodes.get(focusKey) ?? model.nodes.get('')
  const parent = focus?.parentKey !== null && focus ? model.nodes.get(focus.parentKey) : undefined
  const head = focus ? continuation(exploration, focus.key) : null
  const nextKey = focus && head && head.length > focus.depth ? head.slice(0, focus.depth + 1) : null
  const next = nextKey ? model.nodes.get(nextKey) : undefined
  const now = activeHead(exploration)

  // What she spent here, along the path being looked at: the answer that path
  // took out of this fork.
  const wentBy = head && focus && head.length > focus.depth ? head[focus.depth] : undefined
  const spentHere =
    wentBy !== undefined ? (focus?.arms?.[wentBy === '0' ? 0 : 1].record?.energySpent ?? 0) : 0

  const parentFork = parent ? PATH.forks[parent.depth] : undefined
  const nextFork = next ? PATH.forks[next.depth] : undefined
  const arrival = focus?.arrival

  return (
    <div className="stage">
      <Hud
        energy={focus?.values.energy ?? 0}
        energyCap={focus?.energyCap ?? 0}
        spent={spentHere}
        onNow={focusKey !== now ? () => go(now) : null}
      />

      {/* The step before, always in reach. */}
      <button
        className={`peek up${parent ? '' : ' empty'}`}
        disabled={!parent}
        onClick={() => parent && go(parent.key)}
      >
        {parent && parentFork && arrival ? (
          <>
            <span className="pk-arrow">&uarr;</span>
            <span className="pk-scale">{SCALE_NAMES[parentFork.scale]}</span>
            {/* What she did comes first: on a narrow screen the timestamp is the
                part that should be cut, not the answer. */}
            <span className="pk-did">{parentFork.options[arrival.resolvedIndex].label}</span>
            <span className="pk-when">{parentFork.when}</span>
          </>
        ) : (
          <span className="pk-text">the first question she is asked</span>
        )}
      </button>

      <Graph
        path={PATH}
        model={model}
        focusKey={focus?.key ?? ''}
        scrollReq={scrollReq}
        onPress={onPress}
        onFocus={(key) => go(key)}
        onRestart={reset}
      />

      {/* The step after, always in reach. */}
      <button
        className={`peek down${next ? '' : ' empty'}`}
        disabled={!next}
        onClick={() => next && go(next.key)}
      >
        {next ? (
          <>
            <span className="pk-arrow">&darr;</span>
            <span className="pk-scale">{nextFork ? SCALE_NAMES[nextFork.scale] : 'END'}</span>
            <span className="pk-text">{nextFork ? nextFork.when : 'after'}</span>
          </>
        ) : (
          <span className="pk-text">
            {focus?.isEnd ? 'the end of this life' : 'nothing below yet — answer above'}
          </span>
        )}
      </button>
    </div>
  )
}
