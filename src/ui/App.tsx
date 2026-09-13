import { useMemo, useState } from 'react'
import { getPath } from '../content'
import {
  diffRuns,
  peek,
  rewindCost,
  SCALE_LABELS,
  simulate,
  type Divergence,
  type ForkAppraisal,
  type Intent,
} from '../engine'
import { Meters } from './Meters'
import { Receipt } from './Receipt'
import { StepOut } from './StepOut'

const PATH = getPath('ten-digits')

type Phase = 'title' | 'rolling' | 'scene' | 'resolved' | 'stepout' | 'epilogue'

const newSeed = (): number => Math.floor(Math.random() * 2 ** 30)

export const App = (): JSX.Element => {
  const [seed, setSeed] = useState(newSeed)
  const [intents, setIntents] = useState<Intent[]>([])
  const [phase, setPhase] = useState<Phase>('title')
  const [revealed, setRevealed] = useState(0)
  const [hindsightSpent, setHindsightSpent] = useState(0)
  /** The life as it was before the current rewind, kept so we can diff against it. */
  const [shadow, setShadow] = useState<{ intents: Intent[]; fromIndex: number } | null>(null)
  const [divergences, setDivergences] = useState<Divergence[] | null>(null)
  const [highlight, setHighlight] = useState<string | null>(null)

  const run = useMemo(() => simulate(PATH, seed, intents), [seed, intents])
  const pending = useMemo(() => peek(run), [run])
  const hindsightLeft = Math.max(0, run.resources.hindsight - hindsightSpent)

  const reset = (): void => {
    setSeed(newSeed())
    setIntents([])
    setPhase('title')
    setRevealed(0)
    setHindsightSpent(0)
    setShadow(null)
    setDivergences(null)
    setHighlight(null)
  }

  const choose = (optionIndex: 0 | 1): void => {
    setIntents((prev) => [...prev, { optionIndex }])
    setDivergences(null)
    setPhase('resolved')
  }

  const advance = (): void => {
    if (run.finished) setPhase('epilogue')
    else setPhase('scene')
  }

  const rewindTo = (index: number): void => {
    const cost = rewindCost(run.cursor, index)
    if (cost > hindsightLeft) return
    setShadow({ intents, fromIndex: index })
    setHindsightSpent((n) => n + cost)
    setIntents(intents.slice(0, index))
    setDivergences(null)
    setHighlight(null)
    setPhase('scene')
  }

  /** The experiment: keep every later button press, re-run, show what moved. */
  const pressTheSameButtons = (): void => {
    if (!shadow) return
    const tail = shadow.intents.slice(intents.length)
    if (tail.length === 0) return
    const next = [...intents, ...tail]
    const before = simulate(PATH, seed, shadow.intents)
    const after = simulate(PATH, seed, next)
    setIntents(next)
    setDivergences(diffRuns(before, after))
    setShadow(null)
    setPhase('stepout')
  }

  const optionLabelsOf = (a: ForkAppraisal | null): [string, string] => {
    const fork = PATH.forks.find((f) => f.id === a?.forkId)
    return fork ? [fork.options[0].label, fork.options[1].label] : ['', '']
  }

  /* ------------------------------- title ------------------------------- */
  if (phase === 'title') {
    return (
      <div className="shell">
        <div className="spacer" />
        <div className="stack">
          <p className="scale-tag">A game about the part you did not do</p>
          <h1>{PATH.title}</h1>
          <p className="sub">{PATH.anchorAct}</p>
          <p className="sub">
            You are not {PATH.character.name}. You are the thing that thinks it is
            {' '}{PATH.character.name}. Tonight there is one phone call to make, and we are going to
            find out together whether it was ever available.
          </p>
        </div>
        <div className="row">
          <button className="act primary big" onClick={() => setPhase('rolling')}>
            Roll for a life
          </button>
        </div>
        <p className="tiny">
          Prototype, build {__BUILD_ID__}. Life {seed}. Nothing here is your fault yet.
        </p>
        <div className="spacer" />
      </div>
    )
  }

  /* ------------------------------- roll -------------------------------- */
  if (phase === 'rolling') {
    const done = revealed >= run.roll.length
    return (
      <div className="shell">
        <div className="topbar">
          <span>before she starts</span>
          <span className="when">nothing below was chosen</span>
        </div>
        <div>
          {run.roll.slice(0, revealed).map((r) => (
            <div className="roll-item" key={r.categoryId}>
              <div className="roll-cat">{r.categoryLabel}</div>
              <p className="roll-prompt">{r.prompt}</p>
              <p className="roll-result">{r.outcome.label}</p>
              <p className="roll-quip">{r.outcome.quip}</p>
            </div>
          ))}
        </div>
        <div className="row">
          {!done ? (
            <button className="act primary big" onClick={() => setRevealed((n) => n + 1)}>
              {revealed === 0 ? 'Roll' : 'Roll again'}
            </button>
          ) : (
            <button className="act primary big" onClick={() => setPhase('scene')}>
              Start her life
            </button>
          )}
          {revealed > 0 && !done && (
            <span className="tiny" style={{ alignSelf: 'center' }}>
              {run.roll.length - revealed} left
            </span>
          )}
        </div>
        {done && (
          <p className="tiny">
            You cannot re-roll. You can start a different life later, which is a different thing.
          </p>
        )}
        <div className="spacer" />
      </div>
    )
  }

  /* ------------------------------ observer ----------------------------- */
  if (phase === 'stepout') {
    return (
      <div className="shell">
        <StepOut
          run={run}
          pending={
            pending
              ? {
                  appraisal: pending.appraisal,
                  optionLabels: [pending.fork.options[0].label, pending.fork.options[1].label],
                }
              : null
          }
          hindsightLeft={hindsightLeft}
          highlightForkId={highlight}
          divergences={divergences}
          onRewind={rewindTo}
          onClose={() => {
            setDivergences(null)
            setPhase(run.finished ? 'epilogue' : pending ? 'scene' : 'resolved')
          }}
        />
      </div>
    )
  }

  /* ------------------------------ epilogue ----------------------------- */
  if (phase === 'epilogue') {
    const taken = run.anchor?.taken ?? false
    const confabs = run.records.filter((r) => r.confabulated).length
    const blocked = run.records.filter((r) => r.outcome === 'blocked').length
    const resisted = run.records.filter((r) => r.outcome === 'resisted').length
    return (
      <div className="shell">
        <div className="topbar">
          <span>after</span>
          <span className="when">life {seed}</span>
        </div>
        <p className="prose">{taken ? PATH.epilogue.onAnchorTaken : PATH.epilogue.onAnchorRefused}</p>
        <p className="coda">{PATH.epilogue.coda}</p>
        <div className="panel stack-sm">
          <h2>The tape</h2>
          <p className="tiny">
            {resisted} of {run.records.length} moments went against her tendency.
            <br />
            {confabs} times she did something other than what you pressed, and explained it to
            herself afterwards.
            <br />
            {blocked} times she never came close.
            <br />
            {hindsightLeft} of {run.resources.hindsight} hindsight unspent &mdash; a budget you also
            did not set.
          </p>
        </div>
        <div className="row">
          <button className="act" onClick={() => setPhase('stepout')}>
            Read the case file
          </button>
          <button className="act primary" onClick={reset}>
            Another life
          </button>
        </div>
        <div className="spacer" />
      </div>
    )
  }

  /* -------------------------------- scene ------------------------------ */
  if (phase === 'scene' && pending) {
    const { fork, appraisal } = pending
    const canStepOut = run.records.length > 0
    return (
      <div className="shell">
        <div className="topbar">
          <span className="scale-tag" title={SCALE_LABELS[fork.scale]}>
            {SCALE_LABELS[fork.scale]}
          </span>
          <span className="when">{fork.when}</span>
        </div>
        <Meters resources={run.resources} hindsightLeft={hindsightLeft} />
        <p className="prose">{fork.prose}</p>
        <div className="choices">
          {fork.options.map((opt, i) => (
            <button
              key={opt.id}
              /* The only tell is 1.5% of scale and one step of warmth. */
              className={`choice${i === appraisal.tendencyIndex ? ' lean' : ''}`}
              onClick={() => choose(i as 0 | 1)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {canStepOut && (
          <div className="row">
            <button
              className="act"
              onClick={() => {
                setHighlight(null)
                setPhase('stepout')
              }}
            >
              Step out and look at why
            </button>
          </div>
        )}
        <div className="spacer" />
      </div>
    )
  }

  /* ------------------------------ resolved ----------------------------- */
  const record = run.records[run.records.length - 1]
  if (phase === 'resolved' && record) {
    const wanted = record.fork.options[record.intent.optionIndex]
    const shadowTail = shadow ? shadow.intents.length - intents.length : 0
    return (
      <div className="shell">
        <div className="topbar">
          <span className="scale-tag">{SCALE_LABELS[record.fork.scale]}</span>
          <span className="when">{record.fork.when}</span>
        </div>
        <Meters resources={run.resources} hindsightLeft={hindsightLeft} />
        <p className="narration">{record.narration}</p>

        {record.confabulated && (
          <div className="confab">
            <h4>
              {record.outcome === 'blocked'
                ? 'She was never going to'
                : 'She explains it to herself'}
            </h4>
            <p>{record.confabulation ?? wanted.confabulation}</p>
          </div>
        )}

        {record.outcome === 'resisted' && (
          <p className="tiny">
            She overrode it. It cost {record.energySpent} of {record.energyBefore}. That is not
            available again for a while.
          </p>
        )}
        {record.outcome === 'blocked' && (
          <p className="tiny">
            You pressed &ldquo;{wanted.label}&rdquo;.{' '}
            {record.appraisal.options[record.intent.optionIndex].feasibility === 'impossible'
              ? 'There is no arrangement of this life in which that happens tonight.'
              : `It needed ${record.appraisal.options[record.intent.optionIndex].energyCost} and she had ${record.energyBefore}.`}
          </p>
        )}

        {record.fork.aside && <p className="aside">{record.fork.aside}</p>}

        <div className="row">
          <button className="act primary" onClick={advance}>
            {run.finished ? 'After' : 'Go on'}
          </button>
          {shadowTail > 0 && (
            <button className="act" onClick={pressTheSameButtons}>
              Press the same {shadowTail} buttons again
            </button>
          )}
          <button
            className="act"
            onClick={() => {
              setHighlight(record.fork.id)
              setPhase('stepout')
            }}
          >
            Why did she do that
          </button>
        </div>

        <details>
          <summary className="tiny" style={{ cursor: 'pointer', padding: '0.5rem 0' }}>
            Show the receipt
          </summary>
          <Receipt
            appraisal={record.appraisal}
            optionLabels={optionLabelsOf(record.appraisal)}
            onJumpTo={null}
          />
        </details>
        <div className="spacer" />
      </div>
    )
  }

  return (
    <div className="shell">
      <p className="sub">Nothing left to play.</p>
      <div className="row">
        <button className="act primary" onClick={reset}>
          Another life
        </button>
      </div>
    </div>
  )
}
