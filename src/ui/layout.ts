/**
 * Canvas geometry.
 *
 * A life is a column. A life you stepped out of is the column beside it.
 *
 * Every branch keeps its own lane and they never rejoin, but the ROWS are
 * shared: row N is fork N in every lane. So the same fork, reached by two
 * different lives, sits side by side at the same height -- same question,
 * different person arriving at it, with a different tendency and a different
 * price. The repetition is the argument, and it only reads horizontally.
 */
export const LANE_W = 300
export const LANE_PAD = 50

/** Vertical distance between one fork's stem and the next. */
export const FORK_H = 420

/** How far an arm bows from its lane's spine. */
export const SPREAD = 104

/** Space at the top of each cell for the stem card and the scene prose. */
export const STEM_H = 190

/** Where an arm card hangs, as an offset inside the fork's own cell. */
export const ARM_MID_LOCAL = STEM_H + (FORK_H - STEM_H) * 0.5

export const laneX = (lane: number): number => LANE_PAD + lane * LANE_W + LANE_W / 2
export const canvasWidth = (lanes: number): number => LANE_PAD * 2 + Math.max(1, lanes) * LANE_W

export const forkTop = (index: number): number => index * FORK_H
export const forkSplit = (index: number): number => forkTop(index) + STEM_H
export const forkBottom = (index: number): number => forkTop(index) + FORK_H
export const canvasHeight = (rows: number): number => rows * FORK_H

export const armX = (lane: number, arm: 0 | 1): number =>
  laneX(lane) + (arm === 0 ? -SPREAD : SPREAD)

/**
 * One arm, from wherever the line arrives to the next stem of `lane`, bowing
 * toward the option taken.
 *
 * `fromLane` differs from `lane` only on a branch's first row: that is the
 * moment the life leaves the one it came from, and the curve carrying it across
 * is the same curve that says which way she went.
 */
export const armPath = (fromLane: number, lane: number, index: number, arm: 0 | 1): string => {
  const x0 = laneX(fromLane)
  const x1 = laneX(lane)
  const bow = armX(lane, arm)
  const y0 = forkSplit(index)
  const y1 = forkBottom(index)
  const c = (y1 - y0) * 0.38
  return `M ${x0} ${y0} C ${bow} ${y0 + c}, ${bow} ${y1 - c}, ${x1} ${y1}`
}

export const stemPath = (lane: number, index: number): string =>
  `M ${laneX(lane)} ${forkTop(index)} L ${laneX(lane)} ${forkSplit(index)}`

/* ------------------------------------------------------------------ *
 * Zoom
 * ------------------------------------------------------------------ */

export type Zoom = 'moment' | 'near' | 'life'

export interface Viewport {
  width: number
  height: number
}

/** How many forks the middle framing always holds. */
export const RECENT_WINDOW = 3

export interface Extent {
  /** Rows drawn, i.e. the furthest fork anybody has reached, plus one. */
  rows: number
  lanes: number
}

export const zoomScale = (zoom: Zoom, vp: Viewport, extent: Extent): number => {
  const laneFit = (vp.width - 24) / LANE_W
  if (zoom === 'moment') return Math.min(1, laneFit)
  if (zoom === 'near') return Math.min(laneFit, (vp.height - 210) / (RECENT_WINDOW * FORK_H))
  // 'life' must fit every lane as well as every row -- the comparison across
  // lanes is the thing this framing exists for.
  const fitH = (vp.height - 210) / Math.max(1, canvasHeight(extent.rows))
  const fitW = (vp.width - 24) / canvasWidth(extent.lanes)
  return Math.max(0.04, Math.min(fitW, fitH))
}

export const zoomTransform = (
  zoom: Zoom,
  focus: { index: number; lane: number },
  vp: Viewport,
  extent: Extent,
): { scale: number; x: number; y: number } => {
  const scale = zoomScale(zoom, vp, extent)
  const anchorY =
    zoom === 'life'
      ? canvasHeight(extent.rows) / 2
      : zoom === 'near'
        ? forkTop(focus.index) + FORK_H * 0.5
        : forkSplit(focus.index) + (FORK_H - STEM_H) * 0.46
  const anchorX = zoom === 'life' ? canvasWidth(extent.lanes) / 2 : laneX(focus.lane)
  // 'recent' sits the focused fork low, so the screen fills with what came before.
  const centreFactor = zoom === 'moment' ? 0.44 : zoom === 'near' ? 0.6 : 0.42
  return {
    scale,
    x: vp.width / 2 - scale * anchorX,
    y: vp.height * centreFactor - scale * anchorY,
  }
}
