import { useEffect, useMemo, useState } from 'react'
import { SCALE_LABELS, SCALE_SHORT, type LifePath, type RunResult } from '../engine'
import { AnswerCard } from './AnswerCard'
import {
  canvasHeight,
  canvasWidth,
  EDGE_MID,
  edgePath,
  rowY,
  stemPath,
  stemTickPath,
  zoomTransform,
  type Zoom,
} from './layout'
import { QuestionCard } from './QuestionCard'
import { appraisalAt, edgeFacts, type Tree, type TreeNode } from './tree'

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
  seed: number
  tree: Tree
  zoom: Zoom
  focusKey: string
  onPress: (arm: 0 | 1) => void
  onExplore: (depth: number, arm: 0 | 1) => void
  onFocus: (key: string) => void
  stepBackFor: (depth: number) => { cost: number; affordable: boolean } | null
}

/**
 * The whole game, in one space.
 *
 * Not a scene screen, a receipt screen and a timeline screen but one tree:
 * questions on the rows, answers on the edges between them. The three zoom
 * levels are three distances from it, animated and anchored on the question in
 * hand so orientation survives the move.
 */
export const TreeCanvas = ({
  path,
  seed,
  tree,
  zoom,
  focusKey,
  onPress,
  onExplore,
  onFocus,
  stepBackFor,
}: Props): JSX.Element => {
  const vp = useViewport()
  const runCache = useMemo(() => new Map<string, RunResult>(), [seed, tree])
  const extent = { rows: tree.rows, slots: tree.slots }
  const focusNode = tree.nodes.get(focusKey) ?? tree.nodes.get(tree.rootKey)
  const t = zoomTransform(
    zoom,
    { depth: focusNode?.depth ?? 0, slot: focusNode?.x ?? 0 },
    vp,
    extent,
  )
  const width = canvasWidth(tree.slots)
  const height = canvasHeight(tree.rows)
  const nodes = [...tree.nodes.values()]

  const edgesOf = (node: TreeNode) =>
    ([0, 1] as const)
      .map((arm) => edgeFacts(path, seed, tree, node, arm, runCache))
      .filter((e): e is NonNullable<typeof e> => e !== null)

  return (
    <div className="canvas-viewport">
      <div
        className="canvas"
        style={{ width, height, transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})` }}
      >
        <svg className="wires" width={width} height={height} aria-hidden="true">
          {nodes.map((node) => (
            <g key={`w${node.key}`}>
              {node.depth > 0 && (
                <path
                  className={`wire stem ${node.kind === 'stub' ? 'w-unexplored' : node.onActivePath ? 'w-active' : 'w-parallel'}`}
                  /* With the scene open below it, the wire would run straight
                     through the prose, so it stops at the question card. */
                  d={
                    node.key === focusKey && zoom === 'moment'
                      ? stemTickPath(node.x, node.depth)
                      : stemPath(node.x, node.depth)
                  }
                />
              )}
              {edgesOf(node).map((e) => {
                const explored = e.child.kind === 'lived'
                const cls = node.isCurrent
                  ? 'w-open'
                  : !explored
                    ? 'w-unexplored'
                    : e.child.onActivePath
                      ? 'w-active'
                      : 'w-parallel'
                return (
                  <path
                    key={e.arm}
                    className={`wire ${cls}${e.feasibility === 'impossible' && !explored ? ' w-impossible' : ''}`}
                    d={edgePath(node.x, e.child.x, node.depth)}
                  />
                )
              })}
            </g>
          ))}
        </svg>

        {nodes.map((node) => {
          const fork = path.forks[node.depth]
          if (!fork) return null
          return (
            <QuestionCard
              key={`q${node.key}`}
              fork={fork}
              node={node}
              zoom={zoom}
              focused={node.key === focusKey}
              onFocus={() => onFocus(node.key)}
            />
          )
        })}

        {nodes.map((node) => {
          const fork = path.forks[node.depth]
          if (!fork) return null
          const appraisal = appraisalAt(path, seed, node, runCache)
          return edgesOf(node).map((e) => (
            <AnswerCard
              key={`a${node.key}:${e.arm}`}
              fork={fork}
              node={node}
              edge={e}
              appraisal={appraisal}
              zoom={zoom}
              detailed={node.key === focusKey}
              stepBack={stepBackFor(node.depth)}
              onPress={onPress}
              onExplore={onExplore}
            />
          ))
        })}
      </div>

      {/*
        * The ladder, kept legible.
        *
        * At tree distance the rungs -- childhood at the top, seconds at the
        * bottom -- are the most useful thing on screen, and the one part that
        * must not shrink with the zoom. Drawn outside the transform.
        */}
      {zoom === 'life' && (
        <div className="rungs">
          {Array.from({ length: tree.rows }, (_, i) => {
            const fork = path.forks[i]
            if (!fork) return null
            const isNow = nodes.some((n) => n.depth === i && n.isCurrent)
            return (
              <div
                key={`r${i}`}
                className={`rung${isNow ? ' current' : ''}`}
                style={{ top: t.y + (rowY(i) + EDGE_MID) * t.scale }}
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
