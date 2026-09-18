import { useEffect, useState } from 'react'
import {
  appraiseFork,
  peek,
  SCALE_LABELS,
  SCALE_SHORT,
  type LifePath,
  type RunResult,
} from '../engine'
import type { RowView, Tree } from './branches'
import { ForkNode } from './ForkNode'
import {
  armPath,
  ARM_MID_LOCAL,
  canvasHeight,
  canvasWidth,
  forkTop,
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

export interface Focus {
  branchId: string
  index: number
}

interface Props {
  path: LifePath
  tree: Tree
  runs: Map<string, RunResult>
  activeId: string
  zoom: Zoom
  focus: Focus
  onChoose: (arm: 0 | 1) => void
  onTryOther: (index: number, arm: 0 | 1) => void
  onFocus: (focus: Focus) => void
  stepBackFor: (row: RowView) => { cost: number; affordable: boolean } | null
}

/**
 * The whole game, in one space.
 *
 * There is no separate scene screen, receipt screen and timeline screen: there
 * is one canvas holding every life the player has lived, and those three are
 * three distances from it. Lives run in parallel lanes sharing a row per fork,
 * so the same decision reached by two different pasts can be read side by side.
 */
export const LifeCanvas = ({
  path,
  tree,
  runs,
  activeId,
  zoom,
  focus,
  onChoose,
  onTryOther,
  onFocus,
  stepBackFor,
}: Props): JSX.Element => {
  const vp = useViewport()
  const extent = { rows: tree.rowCount, lanes: tree.lanes }
  const focusLane = tree.laneOf.get(focus.branchId) ?? 0
  const t = zoomTransform(zoom, { index: focus.index, lane: focusLane }, vp, extent)
  const width = canvasWidth(tree.lanes)
  const height = canvasHeight(path.forks.length)

  const appraisalFor = (row: RowView): ReturnType<typeof appraiseFork> | null => {
    if (row.record) return row.record.appraisal
    const run = runs.get(row.branchId)
    if (!run) return null
    const p = peek(run)
    return p ? p.appraisal : null
  }

  const isFocused = (row: RowView): boolean =>
    row.branchId === focus.branchId && row.index === focus.index

  return (
    <div className="canvas-viewport">
      <div
        className="canvas"
        style={{
          width,
          height,
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
        }}
      >
        <svg className="wires" width={width} height={height} aria-hidden="true">
          {tree.rows.map((row) => {
            const tone = row.isActive ? 'w-active' : 'w-parallel'
            const focusedHere = isFocused(row)
            return (
              <g key={`w:${row.key}`}>
                {row.drawStem && <path className="wire stem" d={stemPath(row.lane, row.index)} />}
                {([0, 1] as const).map((i) => {
                  const taken = row.record?.resolvedIndex === i
                  const ghost =
                    row.record !== null && !taken && focusedHere && zoom !== 'life'
                  if (row.record !== null && !taken && !ghost) return null
                  if (row.isOpen) {
                    return (
                      <path
                        key={i}
                        className="wire w-open"
                        d={armPath(row.fromLane, row.lane, row.index, i)}
                      />
                    )
                  }
                  const feas = row.record?.appraisal.options[i].feasibility
                  const cls = [
                    'wire',
                    ghost ? 'w-ghost' : tone,
                    feas === 'impossible' && ghost ? 'w-impossible' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <path key={i} className={cls} d={armPath(row.fromLane, row.lane, row.index, i)} />
                  )
                })}
              </g>
            )
          })}
        </svg>

        {tree.rows.map((row) => {
          const fork = path.forks[row.index]
          if (!fork) return null
          return (
            <ForkNode
              key={row.key}
              fork={fork}
              row={row}
              appraisal={appraisalFor(row)}
              zoom={zoom}
              showStem={row.drawStem && row.lane === focusLane}
              focused={isFocused(row)}
              stepBack={stepBackFor(row)}
              onChoose={onChoose}
              onTryOther={(arm) => onTryOther(row.index, arm)}
              onFocus={() => onFocus({ branchId: row.branchId, index: row.index })}
            />
          )
        })}
      </div>

      {/*
        * The ladder, kept legible.
        *
        * At life distance the rungs -- childhood at the top, seconds at the
        * bottom -- are the most useful thing on screen, and the one part of the
        * canvas that must not shrink with it. Drawn outside the transform,
        * positioned from it, once per row rather than once per lane.
        */}
      {zoom === 'life' && (
        <div className="rungs">
          {Array.from({ length: tree.rowCount }, (_, i) => {
            const fork = path.forks[i]
            if (!fork) return null
            const isNow = tree.rows.some((r) => r.index === i && r.isOpen)
            return (
              <div
                key={`r${i}`}
                className={`rung${isNow ? ' current' : ''}`}
                style={{ top: t.y + (forkTop(i) + ARM_MID_LOCAL) * t.scale }}
                title={SCALE_LABELS[fork.scale]}
              >
                {SCALE_SHORT[fork.scale]}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
