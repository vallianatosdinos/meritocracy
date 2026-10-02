import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SCALE_LABELS, SCALE_NAMES, type LifePath } from '../engine'
import { ForkCard } from './ForkCard'
import type { GraphModel, NodeView } from './graph'

export interface ScrollRequest {
  key: string
  /** 'focus' brings a question to the top; 'reveal' brings its answers there. */
  mode: 'focus' | 'reveal'
  nonce: number
}

interface Props {
  path: LifePath
  model: GraphModel
  focusKey: string
  scrollReq: ScrollRequest
  onPress: (nodeKey: string, arm: 0 | 1) => void
  onFocus: (nodeKey: string) => void
  onRestart: () => void
}

const HEADER_GAP = 14
const ROW_GAP = 72
const TOP_PAD = 14
const CARD_GAP = 30
const EST_HEADER = 170
const EST_CARD = 420
const GHOST_GAP = 40
/** Card padding (0.8rem) and the gap between answer columns (0.5rem), in px. */
const CARD_PAD = 12.8
const ARM_GAP = 8
/** How far each answer column's middle sits from the card's middle. */
const armOffset = (cardW: number): number => (cardW - 2 * CARD_PAD - ARM_GAP) / 4 + ARM_GAP / 2

const useWidth = (): number => {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 402 : window.innerWidth))
  useEffect(() => {
    const on = (): void => setW(window.innerWidth)
    window.addEventListener('resize', on)
    window.addEventListener('orientationchange', on)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('orientationchange', on)
    }
  }, [])
  return w
}

interface Heights {
  header: Record<number, number>
  card: Record<string, number>
}

/**
 * The tree, at reading distance.
 *
 * There are no zoom levels: this is the closest one, and the only one. Rows run
 * top to bottom, one per question, and each row holds every fork of that
 * question the player has reached -- doubling as far as they have pushed it.
 * The question is printed once per row, above whichever fork is in view; the
 * forks are told apart by what she carries into them.
 *
 * Cards are as tall as their receipts need, so rows are measured, not assumed.
 * It is a native scroll container rather than a transformed canvas: a phone
 * gets real momentum scrolling, and navigating is an animated scroll.
 */
export const Graph = ({
  path,
  model,
  focusKey,
  scrollReq,
  onPress,
  onFocus,
  onRestart,
}: Props): JSX.Element => {
  const vw = useWidth()
  const cardW = Math.min(372, vw - 24)
  const slotW = cardW + CARD_GAP
  const padX = Math.max(12, (vw - cardW) / 2)

  const scroller = useRef<HTMLDivElement>(null)
  const headerEls = useRef(new Map<number, HTMLDivElement>())
  const cardEls = useRef(new Map<string, HTMLDivElement>())
  const answersEls = useRef(new Map<string, HTMLDivElement>())
  const handled = useRef(-1)
  const [heights, setHeights] = useState<Heights>({ header: {}, card: {} })

  const headerH = (d: number): number => heights.header[d] ?? EST_HEADER
  const cardH = (k: string): number => heights.card[k] ?? EST_CARD

  const rowTop: number[] = []
  let y = TOP_PAD
  for (const row of model.rows) {
    rowTop[row.depth] = y
    const tallest = Math.max(...row.keys.map(cardH))
    y += headerH(row.depth) + HEADER_GAP + tallest + ROW_GAP
  }
  const contentH = y

  const cx = (n: NodeView): number => padX + n.slot * slotW + cardW / 2
  const cardTop = (n: NodeView): number => (rowTop[n.depth] ?? 0) + headerH(n.depth) + HEADER_GAP
  const width = padX * 2 + (model.slots - 1) * slotW + cardW

  // Measure, then -- once nothing is moving -- carry out any pending scroll.
  useLayoutEffect(() => {
    const header: Record<number, number> = {}
    const card: Record<string, number> = {}
    let changed = false
    for (const [d, el] of headerEls.current) {
      header[d] = el.offsetHeight
      if (Math.abs((heights.header[d] ?? -1) - header[d]) > 1) changed = true
    }
    for (const [k, el] of cardEls.current) {
      card[k] = el.offsetHeight
      if (Math.abs((heights.card[k] ?? -1) - card[k]) > 1) changed = true
    }
    if (changed) {
      setHeights({ header, card })
      return
    }

    if (handled.current === scrollReq.nonce) return
    const el = scroller.current
    const n = model.nodes.get(scrollReq.key)
    if (!el || !n) return
    handled.current = scrollReq.nonce
    const answers = answersEls.current.get(n.key)
    const top =
      scrollReq.mode === 'reveal' && answers
        ? cardTop(n) + answers.offsetTop - 16
        : (rowTop[n.depth] ?? 0) - 6
    el.scrollTo({ left: cx(n) - el.clientWidth / 2, top: Math.max(0, top), behavior: 'smooth' })
  })

  const nodes = [...model.nodes.values()]

  // The anchor act is marked from the first question: a double-ringed node
  // stands below the explored tree until a row of its forks exists, so the
  // player always sees where the life is heading. It shows the act, never how
  // hard it will be.
  const anchorDepth = path.forks.findIndex((f) => f.anchor)
  const anchorFork = anchorDepth >= 0 ? path.forks[anchorDepth] : undefined
  const deepest = model.rows.length > 0 ? model.rows[model.rows.length - 1]!.depth : 0
  const activeNode = model.nodes.get(model.activeKey)
  const ghost =
    anchorFork && activeNode && deepest < anchorDepth
      ? {
          x: cx(activeNode),
          y: contentH - ROW_GAP + GHOST_GAP + 30,
          away: anchorDepth - activeNode.depth,
        }
      : null

  return (
    <div className="graph" ref={scroller}>
      <div className="graph-canvas" style={{ width, height: contentH + 600 }}>
        <svg className="wires" width={width} height={contentH + 600} aria-hidden="true">
          {nodes.map((n) =>
            (n.arms ?? []).map((a) => {
              const x0 = cx(n) + (a.arm === 0 ? -armOffset(cardW) : armOffset(cardW))
              const y0 = cardTop(n) + cardH(n.key)
              const child = a.played ? model.nodes.get(a.childKey) : undefined
              if (!child) {
                return (
                  <path
                    key={`${n.key}${a.arm}`}
                    className="wire w-unexplored"
                    d={`M ${x0} ${y0} L ${x0} ${y0 + 30}`}
                  />
                )
              }
              const x1 = cx(child)
              const y1 = cardTop(child)
              const c = (y1 - y0) * 0.45
              return (
                <path
                  key={`${n.key}${a.arm}`}
                  className={`wire ${a.onActivePath ? 'w-active' : 'w-parallel'}`}
                  d={`M ${x0} ${y0} C ${x0} ${y0 + c}, ${x1} ${y1 - c}, ${x1} ${y1}`}
                />
              )
            }),
          )}
          {ghost && (
            <path
              className="wire w-ghost"
              d={`M ${ghost.x} ${ghost.y - GHOST_GAP + 6} L ${ghost.x} ${ghost.y}`}
            />
          )}
        </svg>

        {model.rows.map((row) => {
          const fork = path.forks[row.depth]
          const focusInRow = model.nodes.get(focusKey)?.depth === row.depth
          const over = model.nodes.get(focusInRow ? focusKey : row.anchorKey)
          if (!over) return null
          return (
            <div
              key={`h${row.depth}`}
              className="scene-header"
              ref={(el) => {
                if (el) headerEls.current.set(row.depth, el)
                else headerEls.current.delete(row.depth)
              }}
              style={{ left: cx(over) - cardW / 2, top: rowTop[row.depth], width: cardW }}
            >
              {fork ? (
                <>
                  <div className="sh-top">
                    <span className="sh-scale" title={SCALE_LABELS[fork.scale]}>
                      {SCALE_NAMES[fork.scale]}
                    </span>
                    <span className="sh-when">{fork.when}</span>
                    {row.keys.length > 1 && (
                      <span className="sh-count">{row.keys.length} forks</span>
                    )}
                  </div>
                  <p className="sh-prose">{fork.prose}</p>
                </>
              ) : (
                <div className="sh-top">
                  <span className="sh-scale">END</span>
                  <span className="sh-when">After</span>
                </div>
              )}
            </div>
          )
        })}

        {nodes.map((n) => {
          const row = model.rows.find((r) => r.depth === n.depth)
          if (!row) return null
          const reference = row.referenceKey ? (model.nodes.get(row.referenceKey) ?? null) : null
          const isAnchor = n.depth === anchorDepth
          return (
            <div
              key={n.key}
              className={`card-slot${isAnchor ? ' anchor' : ''}`}
              style={{ left: cx(n) - cardW / 2, top: cardTop(n) }}
              ref={(el) => {
                if (el) cardEls.current.set(n.key, el)
                else cardEls.current.delete(n.key)
              }}
            >
              <ForkCard
                path={path}
                fork={path.forks[n.depth]}
                node={n}
                row={row}
                reference={reference}
                focused={n.key === focusKey}
                width={cardW}
                answersRef={(el) => {
                  if (el) answersEls.current.set(n.key, el)
                  else answersEls.current.delete(n.key)
                }}
                onPress={onPress}
                onFocus={onFocus}
                onRestart={onRestart}
              />
              {isAnchor && <span className="anchor-label">anchor act</span>}
            </div>
          )
        })}

        {ghost && anchorFork && (
          <div
            className="anchor-ghost"
            style={{ left: ghost.x - cardW / 2, top: ghost.y, width: cardW }}
          >
            <div className="ag-card">
              <div className="sh-top">
                <span className="sh-scale" title={SCALE_LABELS[anchorFork.scale]}>
                  {SCALE_NAMES[anchorFork.scale]}
                </span>
                <span className="sh-when">{anchorFork.when}</span>
              </div>
              <p className="ag-act">{path.anchorAct}</p>
            </div>
            <span className="anchor-label">
              anchor act &middot; {ghost.away} {ghost.away === 1 ? 'question' : 'questions'} on
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
