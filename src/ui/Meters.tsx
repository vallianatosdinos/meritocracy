import { TUNING, type Resources } from '../engine'

interface Props {
  resources: Resources
  hindsightLeft: number
}

/**
 * The energy bar draws its own ceiling.
 *
 * The hatched region is the part of the bar she cannot reach tonight, because
 * of sleep and stress. Showing the missing top is the whole point: the player
 * should be able to see, at a glance, that the budget was set before they
 * arrived.
 */
export const Meters = ({ resources, hindsightLeft }: Props): JSX.Element => {
  const ceiling = TUNING.absoluteEnergyCeiling
  const capPct = (resources.energyCap / ceiling) * 100
  const energyPct = (resources.energy / ceiling) * 100
  const low = resources.energyCap > 0 && resources.energy / resources.energyCap < 0.25

  return (
    <div className="meters">
      <div className="meter">
        <span className="meter-label">Energy</span>
        <span className="meter-track">
          <span
            className={`meter-fill${low ? ' alarm' : ''}`}
            style={{ width: `${Math.max(0, Math.min(100, energyPct))}%` }}
          />
          <span
            className="meter-ghost"
            style={{ left: `${Math.min(100, capPct)}%`, right: 0 }}
            title="Out of reach tonight: sleep debt and stress load"
          />
        </span>
        <span className="meter-num">
          {resources.energy}/{resources.energyCap}
        </span>
      </div>

      <div className="meter">
        <span className="meter-label">Sleep debt</span>
        <span className="meter-track">
          <span className="meter-fill alarm" style={{ width: `${resources.sleepDebt}%` }} />
        </span>
        <span className="meter-num">{resources.sleepDebt}</span>
      </div>

      <div className="meter">
        <span className="meter-label">Hindsight</span>
        <span className="meter-track">
          <span
            className="meter-fill cold"
            style={{
              width: `${
                resources.hindsight > 0 ? (hindsightLeft / resources.hindsight) * 100 : 0
              }%`,
            }}
          />
        </span>
        <span className="meter-num">
          {hindsightLeft}/{resources.hindsight}
        </span>
      </div>
    </div>
  )
}
