import type { Ref } from 'react'
import {
  SCALE_LABELS,
  SCALE_NAMES,
  TRAIT_META,
  type Feasibility,
  type Fork,
  type ForkRecord,
  type LifePath,
} from '../engine'
import type { Measure, NodeView, RowView } from './graph'
import { MEASURES } from './graph'
import { pullShare, splitPulls, type ArmPull } from './pulls'

interface Props {
  path: LifePath
  fork: Fork | undefined
  node: NodeView
  row: RowView
  reference: NodeView | null
  focused: boolean
  width: number
  answersRef: Ref<HTMLDivElement>
  onPress: (nodeKey: string, arm: 0 | 1) => void
  onFocus: (nodeKey: string) => void
  onRestart: () => void
}

const LABEL: Record<Measure, string> = {
  impulseControl: 'Impulse control',
  stressLoad: 'Stress load',
  threatSensitivity: 'Threat sensitivity',
  trust: 'Trust',
  noveltySeeking: 'Novelty seeking',
  empathyReach: 'Empathy reach',
  belonging: 'Belonging',
  conscientiousness: 'Conscientiousness',
  energy: 'Energy',
}

/** Will she be glad of this change? Stress and threat are inverted. */
const helps = (m: Measure, delta: number): boolean =>
  m === 'energy' ? delta > 0 : TRAIT_META[m].inverted ? delta < 0 : delta > 0

const num = (n: number): string => n.toFixed(1)
const sign = (n: number): string => `${n > 0 ? '+' : '−'}${Math.abs(n)}`

/**
 * What she carries into this question.
 *
 * Every fork in a row asks the same question, so the question is printed once
 * for the row and this is what the forks are told apart by. Where the row has
 * more than one fork, a measure that differs between them is lit and carries
 * its difference from the fork on the active path; a measure that is the same
 * everywhere goes quiet.
 */
const Carried = ({
  node,
  row,
  reference,
}: {
  node: NodeView
  row: RowView
  reference: NodeView | null
}): JSX.Element => (
  <div className="carried">
    {MEASURES.map((m) => {
      const v = node.values[m]
      const compared = row.keys.length > 1
      const lit = row.differs.has(m)
      const delta =
        reference && reference.key !== node.key && lit ? v - reference.values[m] : 0
      return (
        <div
          key={m}
          className={`measure${compared ? (lit ? ' lit' : ' quiet') : ''}`}
          title={m === 'energy' ? 'Energy she has at this question' : TRAIT_META[m].blurb}
        >
          <span className="m-label">{LABEL[m]}</span>
          <span className="m-bar">
            <span style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />
            {m === 'energy' && (
              <span
                className="m-ghost"
                style={{ left: `${Math.min(100, node.energyCap)}%`, right: 0 }}
              />
            )}
          </span>
          <span className="m-val">
            {m === 'energy' ? `${v}/${node.energyCap}` : v}
          </span>
          {delta !== 0 && (
            <span className={`m-delta ${helps(m, delta) ? 'good' : 'bad'}`}>{sign(delta)}</span>
          )}
        </div>
      )
    })}
    {/* Two forks, one question, and she arrives at both carrying exactly the
        same things: the press behind them changed nothing. Said out loud,
        because silence here reads as a bug. */}
    {row.keys.length > 1 && row.differs.size === 0 && (
      <p className="carried-same">
        she carries exactly the same into every fork of this question
      </p>
    )}
  </div>
)

const Items = ({ pull }: { pull: ArmPull }): JSX.Element => {
  const sorted = [...pull.items].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
  return (
    <div className="r-items">
      {sorted.map((c, i) => (
        <div className={`r-item${c.locked ? ' locked' : ''}`} key={`${c.factorId ?? c.label}-${i}`}>
          <span className="sc" title={SCALE_LABELS[c.scale]}>
            {SCALE_NAMES[c.scale]}
          </span>
          <span className="lb">
            {c.label}
            {c.note ? <i> &middot; {c.note}</i> : null}
          </span>
          <span className="wt">{num(Math.abs(c.weight))}</span>
        </div>
      ))}
      {pull.folded.count > 0 && (
        <div className="r-item locked">
          <span className="lb">
            {pull.folded.count} smaller thing{pull.folded.count === 1 ? '' : 's'}
          </span>
          <span className="wt">{num(pull.folded.sum)}</span>
        </div>
      )}
    </div>
  )
}

const spentLine = (r: ForkRecord): string => {
  switch (r.outcome) {
    case 'flowed':
      return 'free · the way she was going'
    case 'overrode':
      return `she overrode it · cost ${r.energySpent} of ${r.energyBefore}`
    case 'failed':
      return `she tried · cost ${r.energySpent} anyway`
    case 'emptied-out':
      return `she tried and emptied out · ${r.energySpent}`
    case 'never-in-reach':
      return 'never in reach'
  }
}

/**
 * The verdict line. "Always going to" is only true when the other answer was
 * never in reach; where it was, she leaned, and the line says so.
 */
const verdict = (tendency: string, other: Feasibility): string => {
  switch (other) {
    case 'never-in-reach':
      return `why · she was always going to “${tendency}”`
    case 'empties-out':
      return `why · she leaned toward “${tendency}”, and had too little left for the other`
    case 'affordable':
      return `why · she leaned toward “${tendency}”; the other was within reach`
  }
}

export const ForkCard = ({
  path,
  fork,
  node,
  row,
  reference,
  focused,
  width,
  answersRef,
  onPress,
  onFocus,
  onRestart,
}: Props): JSX.Element => {
  const tone = node.onActivePath ? 'active' : 'parallel'
  const arrival = node.arrival
  const parentFork = node.depth > 0 ? path.forks[node.depth - 1] : undefined

  const via = arrival && parentFork && (
    <div className={`via ${tone}`}>
      after &ldquo;{parentFork.options[arrival.resolvedIndex].label}&rdquo;
      {arrival.confabulated && (
        <> &middot; you pressed &ldquo;{parentFork.options[arrival.intent.optionIndex].label}&rdquo;</>
      )}
    </div>
  )

  /* ------------------------------ a finished life ------------------------------ */
  if (node.isEnd || !fork || !node.arms || !node.appraisal) {
    const taken = node.run.anchor?.taken ?? false
    return (
      <div
        className={`fork-card end ${tone}${focused ? ' focused' : ''}`}
        style={{ width }}
        onClick={() => onFocus(node.key)}
      >
        {via}
        <p className="narration">
          {taken ? path.epilogue.onAnchorTaken : path.epilogue.onAnchorRefused}
        </p>
        <p className="coda">{path.epilogue.coda}</p>
        <div className="row">
          <button
            className="act primary"
            onClick={(ev) => {
              ev.stopPropagation()
              onRestart()
            }}
          >
            Another life
          </button>
        </div>
      </div>
    )
  }

  const appraisal = node.appraisal
  const pulls = splitPulls(appraisal)
  const tendency = fork.options[appraisal.tendencyIndex]

  return (
    <div
      className={`fork-card ${tone}${node.isActiveHead ? ' now' : ''}${focused ? ' focused' : ''}`}
      style={{ width }}
      onClick={() => onFocus(node.key)}
    >
      {via}
      <Carried node={node} row={row} reference={reference} />

      {/* One column per answer: the button, then -- once pressed -- what came
          of it, straight underneath, so the two outcomes read side by side and
          each sits above the branch it sends down the tree. */}
      <div className="answers" ref={answersRef}>
        {node.arms.map((a) => {
          const opt = fork.options[a.arm]
          const r = a.played ? a.record : null
          const goingBack = !a.played && !node.isHead
          const classes = [
            'answer',
            a.played ? (a.onActivePath ? 'played active' : 'played parallel') : 'unplayed',
            r?.confabulated ? 'confab' : '',
            // The nudge: on an undecided fork the tendency is 1.5% larger and one
            // step warmer, and nothing else marks it.
            node.isHead && appraisal.options[a.arm].isTendency ? 'lean' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <div key={a.arm} className="arm">
              <button
                className={classes}
                onClick={(ev) => {
                  ev.stopPropagation()
                  onPress(node.key, a.arm)
                }}
              >
                <span className="a-label">{opt.label}</span>
                {r && (
                  <span className="a-result">
                    {r.confabulated
                      ? `she did “${fork.options[r.resolvedIndex].label}” instead`
                      : spentLine(r)}
                  </span>
                )}
                {goingBack && <span className="a-back">see what happens</span>}
              </button>
              {r && (
                <div className={`outcome ${a.onActivePath ? 'active' : 'parallel'}`}>
                  <h4>
                    you pressed this
                    {r.confabulated ? ' · she did the other thing' : ''}
                  </h4>
                  {r.confabulated && r.confabulation && (
                    <div className="confab">
                      <p>{r.confabulation}</p>
                    </div>
                  )}
                  <p className="narration">{r.narration}</p>
                  <p className="spent">{spentLine(r)}</p>
                  {a.joined && (
                    <p className="joined">
                      nothing in her changed &middot; this branch joins &ldquo;
                      {fork.options[r.resolvedIndex].label}&rdquo;
                    </p>
                  )}
                  {opt.aside && <p className="aside">{opt.aside}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* The receipt belongs to the question, not to an answer: it is the same
          whichever one was pressed, so it is printed once, and only once the
          question has been answered. Before that it would be the answer key. */}
      {node.anyPlayed && (
        <div className="receipt">
          <h4>{verdict(tendency.label, appraisal.options[appraisal.tendencyIndex === 0 ? 1 : 0].feasibility)}</h4>
          <div className="r-cols">
            {([0, 1] as const).map((arm) => {
              const o = appraisal.options[arm]
              return (
                <div key={arm} className={`r-col${o.isTendency ? ' tendency' : ''}`}>
                  <div className="r-head">
                    <span className="r-share">{Math.round(pullShare(pulls, arm) * 100)}%</span>
                    <span className="r-toward">toward &ldquo;{fork.options[arm].label}&rdquo;</span>
                    <span
                      className={`chip ${
                        o.isTendency
                          ? 'free'
                          : o.feasibility === 'never-in-reach'
                            ? 'never-in-reach'
                            : o.feasibility === 'empties-out'
                              ? 'empties-out'
                              : 'cost'
                      }`}
                    >
                      {o.isTendency
                        ? 'free'
                        : o.feasibility === 'never-in-reach'
                          ? 'no road here'
                          : `cost ${o.energyCost}${o.feasibility === 'empties-out' ? ' · more than she had' : ''}`}
                    </span>
                  </div>
                  <Items pull={pulls[arm]} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {node.anyPlayed && fork.aside && <p className="aside">{fork.aside}</p>}
    </div>
  )
}
