import { TUNING, type EnergyArrival } from '../engine'
import { ENERGY_ARRIVAL } from './energy'

interface Props {
  energy: number
  energyCap: number
  /**
   * What she spent at the fork in view, once it has been answered along the
   * path being looked at. Zero before the press: nothing about a fork's cost
   * shows until then.
   */
  spent: number
  /** How her energy arrived at the fork in view. null past the last question. */
  arrival: EnergyArrival | null
  /** Shown when the player is looking somewhere other than where she is. */
  onNow: (() => void) | null
}

/**
 * The energy bar draws its own ceiling: the hatched region is the part she
 * cannot reach at this question because of sleep and stress, set before the
 * player arrived. Once the fork in view is answered, the bar shows what is left
 * after it, and the part she spent stays outlined so the cost is visible.
 */
export const Hud = ({ energy, energyCap, spent, arrival, onNow }: Props): JSX.Element => {
  const ceiling = TUNING.absoluteEnergyCeiling
  const left = Math.max(0, energy - spent)
  const low = energyCap > 0 && left / energyCap < 0.25
  const pct = (n: number): string => `${Math.max(0, Math.min(100, (n / ceiling) * 100))}%`
  return (
    <div className="hud">
      <div className="meters">
        <div className="meter">
          <span className="meter-label">Energy</span>
          <span className="meter-track">
            <span className={`meter-fill${low ? ' alarm' : ''}`} style={{ width: pct(left) }} />
            {spent > 0 && (
              <span
                className="meter-spent"
                style={{ left: pct(left), width: pct(Math.min(spent, energy)) }}
              />
            )}
            <span
              className="meter-ghost"
              style={{ left: `${Math.min(100, (energyCap / ceiling) * 100)}%`, right: 0 }}
              title="Out of reach here: sleep debt and stress load"
            />
          </span>
          <span className="meter-num">
            {left}/{energyCap}
            {spent > 0 && <span className="meter-delta">&minus;{spent}</span>}
          </span>
        </div>
        {arrival && (
          <span className={`meter-note ea-${arrival}`}>
            {ENERGY_ARRIVAL[arrival].mark} {ENERGY_ARRIVAL[arrival].short}
          </span>
        )}
      </div>
      {onNow && (
        <button className="now-btn" onClick={onNow}>
          now &darr;
        </button>
      )}
    </div>
  )
}
