import {
  SCALE_LABELS,
  SCALE_SHORT,
  TUNING,
  type Contribution,
  type ForkAppraisal,
} from '../engine'

interface Props {
  appraisal: ForkAppraisal
  optionLabels: [string, string]
  /** null when the receipt is read-only (e.g. reviewing a finished life). */
  onJumpTo: ((forkId: string) => void) | null
}

const sign = (n: number): string => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`

/**
 * The receipt.
 *
 * This component is the game's argument. Every term that produced the leaning,
 * sorted deepest cause first, each one attributed to a fact rather than a stat,
 * each one marked editable or not. Nothing is withheld and nothing is
 * invented -- engine tests assert that these rows sum exactly to the leaning.
 */
export const Receipt = ({ appraisal, optionLabels, onJumpTo }: Props): JSX.Element => {
  const shown = appraisal.contributions.filter(
    (c) => Math.abs(c.weight) >= TUNING.receiptNoiseFloor,
  )
  const folded = appraisal.contributions.filter(
    (c) => Math.abs(c.weight) < TUNING.receiptNoiseFloor,
  )
  const foldedSum = folded.reduce((a, c) => a + c.weight, 0)
  const toward = appraisal.leaning >= 0 ? optionLabels[0] : optionLabels[1]

  const row = (c: Contribution, i: number): JSX.Element => (
    <div className={`contrib${c.locked ? ' locked' : ''}`} key={`${c.factorId ?? c.label}-${i}`}>
      <span className="sc" title={SCALE_LABELS[c.scale]}>
        {SCALE_SHORT[c.scale]}
      </span>
      <span className="lb">
        {c.label}
        {c.note ? <> <span className="lock">&middot; {c.note}</span></> : null}
        {c.locked ? (
          <> <span className="lock">&#9633; fixed</span></>
        ) : onJumpTo && c.sourceForkId ? (
          <>
            {' '}
            <button className="jump" onClick={() => onJumpTo(c.sourceForkId!)}>
              go back to this
            </button>
          </>
        ) : null}
      </span>
      <span className={`wt ${c.weight > 0 ? 'pos' : 'neg'}`}>{sign(c.weight)}</span>
    </div>
  )

  return (
    <div className="receipt">
      <div className="receipt-head">
        <span>why</span>
        <span>
          toward &ldquo;{toward}&rdquo;
        </span>
      </div>
      {shown.map(row)}
      {folded.length > 0 && (
        <div className="contrib locked">
          <span className="sc">&mdash;</span>
          <span className="lb">
            and {folded.length} other things too small to name, which are also why
          </span>
          <span className={`wt ${foldedSum > 0 ? 'pos' : 'neg'}`}>{sign(foldedSum)}</span>
        </div>
      )}
      <div className="receipt-total">
        <span className="sc">TOTAL</span>
        <span className="lb">
          She is going to do: <strong>{toward}</strong>
        </span>
        <span className={`wt ${appraisal.leaning > 0 ? 'pos' : 'neg'}`}>
          {sign(appraisal.leaning)}
        </span>
      </div>
    </div>
  )
}
