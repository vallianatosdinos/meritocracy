import type { LifePath } from '../engine'
import { tenDigits } from './paths/ten-digits'

export const PATHS: LifePath[] = [tenDigits]

export const getPath = (id: string): LifePath => {
  const p = PATHS.find((x) => x.id === id)
  if (!p) throw new Error(`unknown path: ${id}`)
  return p
}

export { tenDigits }
