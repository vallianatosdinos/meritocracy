import { useState } from 'react'
import {
  isPlayableScale,
  rewindCost,
  SCALE_LABELS,
  SCALE_SHORT,
  type Divergence,
  type ForkAppraisal,
  type RunResult,
} from '../engine'
import { Receipt } from './Receipt'

interface Props {
  run: RunResult
  /** Appraisal of the fork she is standing at, if she has not resolved it yet. */
  pending: { appraisal: ForkAppraisal; optionLabels: [string, string] } | null
  hindsightLeft: number
  highlightForkId: string | null
  divergences: Divergence[] | null
  onRewind: (index: number) => void
  onClose: () => void
}

const OUTCOME_FLAG: Record<string, string> = {
  flowed: 'went with it',
  resisted: 'overrode it',
  failed: 'tried, failed',
  blocked: 'never in reach',
}

/**
 * Observer mode.
 *
 * The player stops being the character and becomes the person reading the case
 * file. This is where the game's actual agency lives: not in the decision, but
 * in walking back up the causal chain looking for a rung that can still be
 * moved. Most of them cannot.
 */
export const StepOut = ({
  run,
  pending,
  hindsightLeft,
  highlightForkId,
  divergences,
  onRewind,
  onClose,
}: Props): JSX.Element => {
  const [selected, setSelected] = useState<number | null>(null)

  const cursor = run.cursor
  const cost = selected === null ? 0 : rewindCost(cursor, selected)
  const affordable = selected !== null && cost <= hindsightLeft

  const lockedFactors = run.factors.filter((f) => !isPlayableScale(f.scale))

  return (
    <div className="stack">
      <div className="topbar">
        <span>observer</span>
        <span className="when">{run.path.character.name}, the whole thing</span>
      </div>

      {divergences && (
        <div className="panel stack-sm">
          <h2>You pressed the same buttons</h2>
          {divergences.length === 0 ? (
            <p className="sub">
              Nothing downstream came out differently. The edit was real and the life absorbed it
              without comment.
            </p>
          ) : (
            <>
              <p className="sub">
                {divergences.length === 1
                  ? 'One thing came out differently.'
                  : `${divergences.length} things came out differently.`}{' '}
                You did not change any of your inputs after the edit.
              </p>
              <div className="spine">
                {divergences.map((d) => {
                  const fork = run.path.forks[d.index]
                  if (!fork) return null
                  return (
                    <div className="node" key={d.forkId}>
                      <span className="sc">{SCALE_SHORT[fork.scale]}</span>
                      <span className="what">
                        {fork.when}
                        <small>
                          {fork.options[d.before.resolvedIndex].label} &rarr;{' '}
                          {fork.options[d.after.resolvedIndex].label}
                        </small>
                      </span>
                      <span className="flag">{OUTCOME_FLAG[d.after.outcome]}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {pending && (
        <div className="stack-sm">
          <h2>The decision in front of her</h2>
          <Receipt
            appraisal={pending.appraisal}
            optionLabels={pending.optionLabels}
            onJumpTo={(forkId) => {
              const i = run.path.forks.findIndex((f) => f.id === forkId)
              if (i >= 0) setSelected(i)
            }}
          />
        </div>
      )}

      <div className="stack-sm">
        <h2>Everything that got her here</h2>
        <div className="spine">
          {run.records.map((r) => {
            const isHighlight = r.fork.id === highlightForkId
            const isSelected = selected === r.index
            return (
              <div
                className={`node${isSelected || isHighlight ? ' current' : ''}`}
                key={r.fork.id}
                onClick={() => setSelected(r.index)}
                style={{ cursor: 'pointer' }}
              >
                <span className="sc" title={SCALE_LABELS[r.fork.scale]}>
                  {SCALE_SHORT[r.fork.scale]}
                </span>
                <span className="what">
                  {r.fork.options[r.resolvedIndex].label}
                  <small>
                    {r.fork.when}
                    {r.energySpent > 0 ? ` · cost ${r.energySpent}` : ''}
                  </small>
                </span>
                <span
                  className={`flag${
                    r.confabulated ? ' confab' : r.outcome === 'resisted' ? ' resisted' : ''
                  }`}
                >
                  {OUTCOME_FLAG[r.outcome]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="panel stack-sm">
        <h2>The other side of the wall</h2>
        <p className="tiny">
          These are on the receipt and cannot be gone back to. Not because the game will not let
          you. Because there is no moment in them where anybody chose anything.
        </p>
        <div className="spine">
          {lockedFactors.map((f) => (
            <div className="node" key={f.id}>
              <span className="sc">{SCALE_SHORT[f.scale]}</span>
              <span className="what">
                {f.label}
                <small>{SCALE_LABELS[f.scale]}</small>
              </span>
              <span className="flag">fixed</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stack-sm">
        {selected !== null && run.path.forks[selected] && (
          <p className="sub">
            Go back to <strong>{run.path.forks[selected]!.when}</strong> &mdash;{' '}
            {run.path.forks[selected]!.options.map((o) => o.label).join(' / ')}.<br />
            <span className="tiny">
              Costs {cost} hindsight of {hindsightLeft} left. Everything after it gets lived again.
            </span>
          </p>
        )}
        <div className="row">
          <button
            className="act primary"
            disabled={selected === null || !affordable}
            onClick={() => selected !== null && onRewind(selected)}
          >
            {selected === null
              ? 'Pick a moment'
              : affordable
                ? 'Go back to it'
                : 'Not enough hindsight'}
          </button>
          <button className="act" onClick={onClose}>
            Back to her
          </button>
        </div>
      </div>
    </div>
  )
}
