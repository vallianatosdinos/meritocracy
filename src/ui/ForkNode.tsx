import {
  SCALE_LABELS,
  SCALE_SHORT,
  type Fork,
  type ForkAppraisal,
  type ForkRecord,
} from '../engine'
import type { RowView } from './branches'
import { ARM_MID_LOCAL, armX, forkTop, FORK_H, laneX, STEM_H } from './layout'
import { pullShare, splitPulls, type ArmPull } from './pulls'
import type { Zoom } from './layout'

interface Props {
  fork: Fork
  row: RowView
  /** From the record if lived, from peek() if this is the undecided fork. */
  appraisal: ForkAppraisal | null
  zoom: Zoom
  /** One label per row is enough; the focused lane carries it. */
  showStem: boolean
  focused: boolean
  /** Hindsight a step back to here would cost, and whether it can be paid. */
  stepBack: { cost: number; affordable: boolean } | null
  onChoose: (arm: 0 | 1) => void
  onTryOther: (arm: 0 | 1) => void
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
 * One fork, in one life's lane.
 *
 * Note what is absent from an undecided fork: cost, feasibility, pull shares,
 * which arm is the tendency. Showing those before the press would replace the
 * central illusion with a menu. They appear the instant the fork is behind her,
 * which is also roughly when a person gets to know what a choice cost them.
 */
export const ForkNode = ({
  fork,
  row,
  appraisal,
  zoom,
  showStem,
  focused,
  stepBack,
  onChoose,
  onTryOther,
  onFocus,
}: Props): JSX.Element => {
  const record: ForkRecord | null = row.record
  const lived = record !== null
  const pulls = appraisal ? splitPulls(appraisal) : null
  const labels = zoom !== 'life'
  const anatomy = lived && labels
  const detail = anatomy && zoom === 'moment' && focused
  const localX = (x: number): number => x - laneX(row.lane) + laneX(row.lane)

  const arm = (index: 0 | 1): JSX.Element | null => {
    const opt = fork.options[index]
    const taken = lived && record.resolvedIndex === index
    const appraised = appraisal?.options[index]
    const isTendency = appraised?.isTendency === true
    const pull = pulls?.[index]
    const pressedButNotTaken =
      lived && record.confabulated && record.intent.optionIndex === index

    /*
     * The road not taken, on request.
     *
     * At rest an arm nobody walked is not drawn -- that is the claim. But a
     * fork already passed would then look like a plain curve, and a player has
     * no way to learn that going back is a thing the game does. So inspecting
     * one reveals the other arm, dashed, with the single control that acts on
     * it.
     */
    if (lived && !taken) {
      if (!focused || zoom === 'life' || !stepBack) return null
      return (
        <div
          className={`arm-card ghost${stepBack.affordable ? '' : ' unaffordable'}`}
          style={{ left: localX(armX(row.lane, index)), top: ARM_MID_LOCAL }}
          role="button"
          tabIndex={0}
          onClick={() => stepBack.affordable && onTryOther(index)}
        >
          <div className="arm-label">{opt.label}</div>
          <div className="ghost-act">
            {stepBack.affordable
              ? `go back and try this · ${stepBack.cost}`
              : `needs ${stepBack.cost} hindsight`}
          </div>
        </div>
      )
    }

    if (zoom === 'life') {
      return (
        <div
          className={`arm-dot${taken ? ' taken' : ''}${row.isActive ? ' active' : ' parallel'}${
            row.isOpen ? ' open' : ''
          }`}
          style={{ left: localX(armX(row.lane, index)), top: ARM_MID_LOCAL }}
          onClick={onFocus}
        />
      )
    }

    const classes = [
      'arm-card',
      row.isOpen ? 'is-open' : row.isActive ? 'is-active' : 'is-parallel',
      taken ? 'taken' : '',
      pressedButNotTaken ? 'pressed' : '',
      detail ? 'detailed' : '',
      /*
       * The nudge. On an undecided fork the tendency arm is 1.5% larger and one
       * step warmer, and nothing else marks it. Players pick it and report
       * having chosen freely, which is the entire design.
       */
      row.isOpen && isTendency ? 'lean' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        className={classes}
        style={
          detail
            ? {
                left: localX(armX(row.lane, index)),
                top: STEM_H + 10,
                transform: 'translate(-50%, 0)',
              }
            : { left: localX(armX(row.lane, index)), top: ARM_MID_LOCAL }
        }
        onClick={row.isOpen ? () => onChoose(index) : onFocus}
        role={row.isOpen ? 'button' : undefined}
        tabIndex={row.isOpen ? 0 : undefined}
      >
        <div className="arm-label">{opt.label}</div>

        {pulls && anatomy && (
          <div className="arm-pull" title="How hard her history pushes this way">
            <span className="arm-bar">
              <span style={{ width: `${Math.round(pullShare(pulls, index) * 100)}%` }} />
            </span>
            <span className="arm-total">{Math.round(pullShare(pulls, index) * 100)}%</span>
          </div>
        )}

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

        {pressedButNotTaken && anatomy && <div className="arm-pressed">you pressed this</div>}
        {taken && row.sameAsParent && anatomy && (
          <div className="arm-same">you went back &mdash; she did it anyway</div>
        )}
        {detail && pull && <ArmDetail pull={pull} />}
      </div>
    )
  }

  return (
    <div
      className={`fork-node${row.isOpen ? ' current' : ''}${focused ? ' focused' : ''}`}
      style={{ top: forkTop(row.index), height: FORK_H }}
    >
      {showStem && labels && (
        <div
          className={`stem-card${row.isOpen ? ' current' : ''}${row.isActive ? '' : ' parallel'}`}
          style={{ left: laneX(row.lane) }}
          onClick={onFocus}
        >
          <span className="stem-scale">{SCALE_SHORT[fork.scale]}</span>
          <span className="stem-when">{fork.when}</span>
          {row.isOpen && <span className="stem-now">now</span>}
        </div>
      )}
      {zoom === 'moment' && focused && (
        <p className="stem-prose" style={{ left: laneX(row.lane) }}>
          {fork.prose}
        </p>
      )}
      {arm(0)}
      {arm(1)}
    </div>
  )
}
