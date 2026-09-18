import {
  SCALE_LABELS,
  SCALE_SHORT,
  type Fork,
  type ForkAppraisal,
  type ForkRecord,
} from '../engine'
import type { ForkFacts } from './branches'
import { ARM_MID_LOCAL, armX, forkTop, FORK_H, STEM_H } from './layout'
import { pullShare, splitPulls, type ArmPull } from './pulls'
import type { Zoom } from './layout'

interface Props {
  fork: Fork
  facts: ForkFacts
  /** Appraisal of the fork: from the record if lived, from peek() if current. */
  appraisal: ForkAppraisal | null
  record: ForkRecord | null
  zoom: Zoom
  focused: boolean
  onChoose: (arm: 0 | 1) => void
  onFocus: () => void
}

const num = (n: number): string => n.toFixed(1)

/** Beyond this the card stops being readable and starts being a wall. */
const MAX_ROWS = 5

const ArmDetail = ({ pull }: { pull: ArmPull }): JSX.Element => {
  const sorted = [...pull.items].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
  const shown = sorted.slice(0, MAX_ROWS)
  const rest = sorted.slice(MAX_ROWS)
  const restSum = rest.reduce((n, c) => n + Math.abs(c.weight), 0) + pull.folded.sum
  const restCount = rest.length + pull.folded.count

  return (
    <div className="arm-items">
      {shown.map((c, i) => (
        <div className={`arm-item${c.locked ? ' locked' : ''}`} key={`${c.factorId ?? c.label}-${i}`}>
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
        <div className="arm-item locked">
          <span className="sc">&mdash;</span>
          <span className="lb">and {restCount} more, which are also why</span>
          <span className="wt">{num(restSum)}</span>
        </div>
      )}
    </div>
  )
}

/**
 * One fork: a stem card and two arm cards hung on the diamond.
 *
 * Note what is deliberately absent from an unresolved fork: cost, feasibility
 * and which arm is the tendency. Showing those before the press would replace
 * the game's central illusion with a menu. They appear the moment the fork is
 * behind her -- which is exactly when a person gets to know what a choice cost
 * them.
 */
export const ForkNode = ({
  fork,
  facts,
  appraisal,
  record,
  zoom,
  focused,
  onChoose,
  onFocus,
}: Props): JSX.Element | null => {
  if (!facts.visible) return null

  const lived = record !== null
  const pulls = appraisal ? splitPulls(appraisal) : null
  const labels = zoom !== 'life'
  /**
   * The anatomy of a fork -- its pulls, its costs, which arm was the tendency --
   * appears only once the fork is behind her.
   *
   * Showing it on the undecided fork would turn the central illusion into a
   * difficulty meter: the player would be reading the answer rather than
   * choosing and then discovering they never were. Everything is revealed the
   * instant the press lands, and stays revealed forever after, which is also
   * roughly when a person gets to learn what a choice of theirs cost.
   */
  const anatomy = lived && labels
  const detail = anatomy && zoom === 'moment' && focused

  const arm = (index: 0 | 1): JSX.Element | null => {
    const a = facts.arms[index]
    if (a.state === 'unlived') return null

    const opt = fork.options[index]
    const taken = lived && record.resolvedIndex === index
    const appraised = appraisal?.options[index]
    const isTendency = appraised?.isTendency === true
    const pull = pulls?.[index]

    if (zoom === 'life') {
      // At life distance the cards would be empty boxes. Only the shape reads.
      return (
        <div
          className={`arm-dot is-${a.state}${taken ? ' taken' : ''}`}
          style={{ left: armX(index), top: ARM_MID_LOCAL }}
          onClick={onFocus}
        />
      )
    }

    const classes = [
      'arm-card',
      `is-${a.state}`,
      /*
       * The nudge. On an undecided fork the tendency arm is 1.5% larger and one
       * step warmer, and nothing else marks it. Players pick it and report
       * having chosen freely, which is the entire design -- so it survives the
       * move to the canvas unchanged.
       */
      a.state === 'open' && isTendency ? 'lean' : '',
      taken ? 'taken' : '',
      lived && !taken ? 'untaken' : '',
      a.pressedButNotTaken ? 'pressed' : '',
      detail ? 'detailed' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const clickable = facts.isCurrent && a.state === 'open'

    return (
      <div
        className={classes}
        /*
         * A detailed card is tall and variable, so it hangs from a fixed point
         * below the prose rather than centring on the arm -- centring makes it
         * grow upward into the scene text.
         */
        style={
          detail
            ? { left: armX(index), top: STEM_H + 10, transform: 'translate(-50%, 0)' }
            : { left: armX(index), top: ARM_MID_LOCAL }
        }
        onClick={clickable ? () => onChoose(index) : onFocus}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
      >
        {labels && <div className="arm-label">{opt.label}</div>}

        {/* The tendency this fork's history creates, as a share of its own pull. */}
        {pulls && anatomy && (
          <div className="arm-pull" title="How hard her history pushes this way">
            <span className="arm-bar">
              <span style={{ width: `${Math.round(pullShare(pulls, index) * 100)}%` }} />
            </span>
            {/* A share, not a raw total: "89.6" of nothing is not a number a
                player can read, "78%" of the force at this fork is. */}
            <span className="arm-total">{Math.round(pullShare(pulls, index) * 100)}%</span>
          </div>
        )}

        {/* Cost is a fact about a decision already made. Never a preview. */}
        {anatomy && appraised && (
          <div className="arm-cost">
            {isTendency ? (
              <span className="chip free">free &middot; tendency</span>
            ) : appraised.feasibility === 'impossible' ? (
              <span className="chip impossible">no road here</span>
            ) : (
              <span className={`chip ${appraised.feasibility === 'out-of-reach' ? 'oor' : 'cost'}`}>
                cost {appraised.energyCost}
                {appraised.feasibility === 'out-of-reach' ? ' · more than she had' : ''}
              </span>
            )}
          </div>
        )}

        {a.pressedButNotTaken && anatomy && (
          <div className="arm-pressed">you pressed this</div>
        )}

        {detail && pull && <ArmDetail pull={pull} />}
      </div>
    )
  }

  return (
    <div
      className={`fork-node${facts.isCurrent ? ' current' : ''}${focused ? ' focused' : ''}`}
      style={{ top: forkTop(facts.index), height: FORK_H }}
    >
      {labels ? (
        <div className={`stem-card${facts.isCurrent ? ' current' : ''}`} onClick={onFocus}>
          <span className="stem-scale">{SCALE_SHORT[fork.scale]}</span>
          <span className="stem-when">{fork.when}</span>
          {facts.isCurrent && <span className="stem-now">now</span>}
        </div>
      ) : null}
      {zoom === 'moment' && focused && <p className="stem-prose">{fork.prose}</p>}
      {arm(0)}
      {arm(1)}
    </div>
  )
}
