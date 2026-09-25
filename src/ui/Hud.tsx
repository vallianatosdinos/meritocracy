import { TUNING } from '../engine'

interface Props {
  energy: number
  energyCap: number
  hindsightLeft: number
  hindsightTotal: number
  /** Shown when the player is looking somewhere other than where she is. */
  onNow: (() => void) | null
}

/**
 * The energy bar draws its own ceiling: the hatched region is the part she
 * cannot reach at this question because of sleep and stress, set before the
 * player arrived.
 */
export const Hud = ({ energy, energyCap, hindsightLeft, hindsightTotal, onNow }: Props): JSX.Element => {
  const ceiling = TUNING.absoluteEnergyCeiling
  const low = energyCap > 0 && energy / energyCap < 0.25
  return (
    <div className="hud">
      <div className="meters">
        <div className="meter">
          <span className="meter-label">Energy</span>
          <span className="meter-track">
            <span
              className={`meter-fill${low ? ' alarm' : ''}`}
              style={{ width: `${Math.max(0, Math.min(100, (energy / ceiling) * 100))}%` }}
            />
            <span
              className="meter-ghost"
              style={{ left: `${Math.min(100, (energyCap / ceiling) * 100)}%`, right: 0 }}
              title="Out of reach here: sleep debt and stress load"
            />
          </span>
          <span className="meter-num">
            {energy}/{energyCap}
          </span>
        </div>
        <div className="meter">
          <span className="meter-label">Hindsight</span>
          <span className="meter-track">
            <span
              className="meter-fill cold"
              style={{ width: `${hindsightTotal > 0 ? (hindsightLeft / hindsightTotal) * 100 : 0}%` }}
            />
          </span>
          <span className="meter-num">{hindsightLeft}</span>
        </div>
      </div>
      {onNow && (
        <button className="now-btn" onClick={onNow}>
          now &darr;
        </button>
      )}
    </div>
  )
}
