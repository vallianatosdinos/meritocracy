import { SCALE_LABELS, SCALE_SHORT, type Fork, type ForkAppraisal } from '../engine'
import { answerX, EDGE_MID, rowY, type Zoom } from './layout'
import { pullShare, splitPulls, type ArmPull } from './pulls'
import type { EdgeFacts, TreeNode } from './tree'

interface Props {
  fork: Fork
  node: TreeNode
  edge: EdgeFacts
  appraisal: ForkAppraisal | null
  zoom: Zoom
  /** Shown when this node's question is the one being inspected. */
  detailed: boolean
  stepBack: { cost: number; affordable: boolean } | null
  onPress: (arm: 0 | 1) => void
  onExplore: (depth: number, arm: 0 | 1) => void
}

const num = (n: number): string => n.toFixed(1)
const MAX_ROWS = 5

const Detail = ({ pull }: { pull: ArmPull }): JSX.Element => {
  const sorted = [...pull.items].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
  const shown = sorted.slice(0, MAX_ROWS)
  const rest = sorted.slice(MAX_ROWS)
  const restSum = rest.reduce((n, c) => n + Math.abs(c.weight), 0) + pull.folded.sum
  const restCount = rest.length + pull.folded.count
  return (
    <div className="a-items">
      {shown.map((c, i) => (
        <div className={`a-item${c.locked ? ' locked' : ''}`} key={`${c.factorId ?? c.label}-${i}`}>
          <span className="sc" title={SCALE_LABELS[c.scale]}>
            {SCALE_SHORT[c.scale]}
          </span>
          <span className="lb">
            {c.label}
            {c.note ? <i> &middot; {c.note}</i> : null}
          </span>
          <span className="wt">{num(Math.abs(c.weight))}</span>
        </div>
      ))}
      {restCount > 0 && (
        <div className="a-item locked">
          <span className="sc">&mdash;</span>
          <span className="lb">and {restCount} more, which are also why</span>
          <span className="wt">{num(restSum)}</span>
        </div>
      )}
    </div>
  )
}

/**
 * An answer, hung on the edge that carries it.
 *
 * Cost, feasibility and which answer is the tendency appear only where somebody
 * has already pressed. On the fork in front of her the two answers are bare:
 * showing their prices first would replace the central illusion with a menu.
 */
export const AnswerCard = ({
  fork,
  node,
  edge,
  appraisal,
  zoom,
  detailed,
  stepBack,
  onPress,
  onExplore,
}: Props): JSX.Element => {
  const opt = fork.options[edge.arm]
  const labels = zoom !== 'life'
  const open = node.isCurrent
  const explored = edge.child.kind === 'lived'
  const anatomy = explored && labels
  const pulls = appraisal ? splitPulls(appraisal) : null
  const pull = pulls?.[edge.arm]
  const showDetail = anatomy && detailed && zoom === 'moment'

  const x = answerX(edge.child.x)
  const y = rowY(node.depth) + EDGE_MID

  if (zoom === 'life') {
    return (
      <div
        className={`a-dot ${explored ? (node.onActivePath && edge.child.onActivePath ? 'active' : 'parallel') : 'unexplored'}`}
        style={{ left: x, top: y }}
        onClick={() => !open && !explored && stepBack?.affordable && onExplore(node.depth, edge.arm)}
      />
    )
  }

  const classes = [
    'a-card',
    open ? 'open' : explored ? (edge.child.onActivePath ? 'active' : 'parallel') : 'unexplored',
    edge.confabulated ? 'confab' : '',
    showDetail ? 'detailed' : '',
    // The nudge: on the undecided fork the tendency is 1.5% larger and one step
    // warmer, and nothing else marks it.
    open && edge.isTendency ? 'lean' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const click = (): void => {
    if (open) onPress(edge.arm)
    else if (!explored && stepBack?.affordable) onExplore(node.depth, edge.arm)
  }

  return (
    <div
      className={classes}
      style={showDetail ? { left: x, top: rowY(node.depth) + QUESTION_TOP } : { left: x, top: y }}
      onClick={click}
      role="button"
      tabIndex={0}
    >
      <div className="a-label">{opt.label}</div>

      {pulls && anatomy && (
        <div className="a-pull" title="How hard her history pushes this way">
          <span className="a-bar">
            <span style={{ width: `${Math.round(pullShare(pulls, edge.arm) * 100)}%` }} />
          </span>
          <span className="a-total">{Math.round(pullShare(pulls, edge.arm) * 100)}%</span>
        </div>
      )}

      {anatomy && (
        <div className="a-cost">
          {edge.isTendency ? (
            <span className="chip free">free &middot; tendency</span>
          ) : edge.feasibility === 'impossible' ? (
            <span className="chip impossible">no road here</span>
          ) : (
            <span className={`chip ${edge.feasibility === 'out-of-reach' ? 'oor' : 'cost'}`}>
              cost {edge.cost}
              {edge.feasibility === 'out-of-reach' ? ' · more than she had' : ''}
            </span>
          )}
        </div>
      )}

      {edge.confabulated && anatomy && (
        <div className="a-confab">
          you pressed this &mdash; she did {fork.options[edge.resolvedIndex ?? 0].label.toLowerCase()}
        </div>
      )}

      {!open && !explored && stepBack && (
        <div className={`a-explore${stepBack.affordable ? '' : ' cold'}`}>
          {stepBack.affordable
            ? `go back and try this · ${stepBack.cost}`
            : `needs ${stepBack.cost} hindsight`}
        </div>
      )}

      {showDetail && pull && <Detail pull={pull} />}
    </div>
  )
}

/** Detailed cards hang from below the prose instead of centring on the edge. */
const QUESTION_TOP = 200
