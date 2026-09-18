import { useEffect, useState } from 'react'
import { appraiseFork, SCALE_LABELS, SCALE_SHORT, type LifePath, type RunResult } from '../engine'
import type { ForkFacts } from './branches'
import { ForkNode } from './ForkNode'
import {
  armMidY,
  armPath,
  CANVAS_W,
  canvasHeight,
  stemPath,
  zoomTransform,
  type Zoom,
} from './layout'

const useViewport = (): { width: number; height: number } => {
  const [vp, setVp] = useState(() => ({
    width: typeof window === 'undefined' ? 402 : window.innerWidth,
    height: typeof window === 'undefined' ? 800 : window.innerHeight,
  }))
  useEffect(() => {
    const onResize = (): void => setVp({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])
  return vp
}

interface Props {
  path: LifePath
  facts: ForkFacts[]
  activeRun: RunResult
  zoom: Zoom
  focusIndex: number
  onChoose: (arm: 0 | 1) => void
  onFocus: (index: number) => void
}

/**
 * The whole game, in one space.
 *
 * There is no separate scene screen, receipt screen and timeline screen: there
 * is one canvas holding her entire life, and the three former screens are three
 * distances from it. Zooming is animated and anchored on the fork in question,
 * so the player can always tell where they went.
 */
export const LifeCanvas = ({
  path,
  facts,
  activeRun,
  zoom,
  focusIndex,
  onChoose,
  onFocus,
}: Props): JSX.Element => {
  const vp = useViewport()
  const n = path.forks.length
  /** Forks nobody has reached are not drawn, so they do not get framed either. */
  const extent = facts.reduce((max, f) => (f.visible ? f.index + 1 : max), 1)
  const t = zoomTransform(zoom, focusIndex, vp, extent)
  const height = canvasHeight(n)

  return (
    <div className="canvas-viewport">
      <div
        className="canvas"
        style={{
          width: CANVAS_W,
          height,
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
        }}
      >
        <svg className="wires" width={CANVAS_W} height={height} aria-hidden="true">
          {facts.map((f) => {
            if (!f.visible) return null
            return (
              <g key={`w${f.index}`}>
                <path className="wire stem" d={stemPath(f.index)} />
                {([0, 1] as const).map((i) => {
                  const a = f.arms[i]
                  if (a.state === 'unlived') return null
                  const rec = activeRun.records[f.index]
                  const feas = rec?.appraisal.options[i].feasibility
                  const cls = [
                    'wire',
                    `w-${a.state}`,
                    feas === 'impossible' ? 'w-impossible' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return <path key={i} className={cls} d={armPath(f.index, i)} />
                })}
              </g>
            )
          })}
        </svg>

        {facts.map((f) => {
          const fork = path.forks[f.index]
          if (!fork || !f.visible) return null
          const record = activeRun.records[f.index] ?? null
          const appraisal = record
            ? record.appraisal
            : f.isCurrent
              ? appraiseFork(fork, activeRun.traits, activeRun.factors, activeRun.resources)
              : null
          return (
            <ForkNode
              key={fork.id}
              fork={fork}
              facts={f}
              appraisal={appraisal}
              record={record}
              zoom={zoom}
              focused={f.index === focusIndex}
              onChoose={onChoose}
              onFocus={() => onFocus(f.index)}
            />
          )
        })}
      </div>

      {/*
        * The ladder, kept legible.
        *
        * At life distance the rungs -- childhood at the top, seconds at the
        * bottom -- are the most useful thing on screen, and they are the one
        * part of the canvas that must not shrink with it. So they are drawn
        * outside the transform and positioned from it.
        */}
      {zoom === 'life' && (
        <div className="rungs">
          {facts.map((f) => {
            const fork = path.forks[f.index]
            if (!fork || !f.visible) return null
            return (
              <button
                key={`r${f.index}`}
                className={`rung${f.isCurrent ? ' current' : ''}`}
                style={{ top: t.y + armMidY(f.index) * t.scale }}
                title={SCALE_LABELS[fork.scale]}
                onClick={() => onFocus(f.index)}
              >
                {SCALE_SHORT[fork.scale]}
                {f.isCurrent && <b>now</b>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
