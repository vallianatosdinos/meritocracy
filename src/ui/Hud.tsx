import { TUNING, type Resources } from '../engine'
import type { Zoom } from './layout'

interface Props {
  resources: Resources
  hindsightLeft: number
  zoom: Zoom
  onZoom: (z: Zoom) => void
}

const ZOOMS: Array<[Zoom, string]> = [
  ['moment', 'moment'],
  ['near', 'around'],
  ['life', 'life'],
]

/**
 * The energy bar draws its own ceiling: the hatched region is the part she
 * cannot reach tonight because of sleep and stress, and it was set before the
 * player arrived.
 */
export const Hud = ({ resources, hindsightLeft, zoom, onZoom }: Props): JSX.Element => {
  const ceiling = TUNING.absoluteEnergyCeiling
  const capPct = (resources.energyCap / ceiling) * 100
  const energyPct = (resources.energy / ceiling) * 100
  const low = resources.energyCap > 0 && resources.energy / resources.energyCap < 0.25

  return (
    <div className="hud">
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
          <span className="meter-label">Hindsight</span>
          <span className="meter-track">
            <span
              className="meter-fill cold"
              style={{
                width: `${resources.hindsight > 0 ? (hindsightLeft / resources.hindsight) * 100 : 0}%`,
              }}
            />
          </span>
          <span className="meter-num">{hindsightLeft}</span>
        </div>
      </div>

      <div className="zoomer" role="group" aria-label="Zoom">
        {ZOOMS.map(([z, label]) => (
          <button
            key={z}
            className={`zoom-btn${zoom === z ? ' on' : ''}`}
            onClick={() => onZoom(z)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
