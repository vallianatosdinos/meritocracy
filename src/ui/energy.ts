import type { EnergyArrival } from '../engine'

/** How her energy arrived here, said out loud: the rule is not guessable. */
export const ENERGY_ARRIVAL: Record<EnergyArrival, { mark: string; line: string }> = {
  reset: {
    mark: '↻',
    line: 'energy reset · a new occasion, she starts this fork full',
  },
  'day-begins': {
    mark: '↻',
    line: 'energy reset · the last day begins; from here on, what she spends stays spent',
  },
  carried: {
    mark: '→',
    line: 'energy carried over · same day, what she spent earlier is still spent',
  },
}
