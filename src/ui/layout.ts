/**
 * Canvas geometry.
 *
 * A life is drawn as a chain of diamonds. That shape is not decoration -- it is
 * what the model actually is: the sequence of forks is fixed, so a choice
 * changes what happens at a fork, never which fork comes next. Each fork
 * therefore splits and rejoins, and a parallel path is a different traversal of
 * the same chain rather than a separate track running off somewhere else.
 *
 * Everything here is in layout units. The canvas is then transformed as a whole
 * to zoom, so the player's eye can follow a single continuous space from "this
 * decision" out to "her whole life" and back.
 */
export const CANVAS_W = 420
export const CX = CANVAS_W / 2

/** Vertical distance between one fork's stem and the next. */
export const FORK_H = 420

/** How far the arms bow out from the spine. */
export const SPREAD = 118

/** Space at the top of each cell for the stem card (time, place, prose). */
export const STEM_H = 190

export const forkTop = (index: number): number => index * FORK_H
export const forkSplit = (index: number): number => forkTop(index) + STEM_H
export const forkBottom = (index: number): number => forkTop(index) + FORK_H

/**
 * Widest point of the arms -- where an arm's card sits -- as an offset INSIDE
 * the fork's own cell.
 *
 * Arm cards are children of a .fork-node that is already translated to
 * forkTop(index), so they must be placed in cell-local coordinates. Using the
 * absolute canvas y here double-counts the offset, which is invisible at fork 0
 * and wrong for every fork after it.
 */
export const ARM_MID_LOCAL = STEM_H + (FORK_H - STEM_H) * 0.5

/** Absolute canvas y of the same point, for the SVG layer. */
export const armMidY = (index: number): number => forkTop(index) + ARM_MID_LOCAL

export const armX = (arm: 0 | 1): number => (arm === 0 ? CX - SPREAD : CX + SPREAD)

/**
 * One arm, as a cubic from the split point out to its widest and back to the
 * next stem.
 */
export const armPath = (index: number, arm: 0 | 1): string => {
  const x = armX(arm)
  const y0 = forkSplit(index)
  const y1 = forkBottom(index)
  const c = (y1 - y0) * 0.36
  return `M ${CX} ${y0} C ${x} ${y0 + c}, ${x} ${y1 - c}, ${CX} ${y1}`
}

/** The straight bit at the top of a cell, before the split. */
export const stemPath = (index: number): string =>
  `M ${CX} ${forkTop(index)} L ${CX} ${forkSplit(index)}`

export const canvasHeight = (forkCount: number): number => forkCount * FORK_H

/* ------------------------------------------------------------------ *
 * Zoom
 *
 * Three framings rather than free zoom: the levels are what decide how much
 * text is legible, so they may as well be the thing the player moves between.
 * ------------------------------------------------------------------ */

export type Zoom = 'moment' | 'near' | 'life'

export interface Viewport {
  width: number
  height: number
}

/**
 * Scale factor for a framing.
 *
 * 'life' fits the part of the chain that exists -- forks nobody has reached are
 * not drawn, so fitting all of them would frame mostly empty space and shrink
 * the life the player actually has.
 */
/** How many forks the middle framing always holds. */
export const RECENT_WINDOW = 3

export const zoomScale = (zoom: Zoom, vp: Viewport, extent: number): number => {
  const fitW = (vp.width - 32) / CANVAS_W
  if (zoom === 'moment') return Math.min(1, (vp.width - 16) / CANVAS_W)
  // 'recent' frames a fixed window -- three forks, whatever the life is doing.
  // It therefore stays put as the life grows while 'life' keeps shrinking, which
  // is the only thing that makes the middle framing worth having.
  if (zoom === 'near')
    return Math.min(fitW, (vp.height - 210) / (RECENT_WINDOW * FORK_H))
  const fitH = (vp.height - 210) / Math.max(1, canvasHeight(extent))
  return Math.max(0.05, Math.min(fitW, fitH))
}

/**
 * Translation that puts a given fork where the player expects it.
 *
 * The focused fork holds still across a zoom change -- that is the whole point
 * of animating rather than cutting between screens.
 */
export const zoomTransform = (
  zoom: Zoom,
  focusIndex: number,
  vp: Viewport,
  extent: number,
): { scale: number; x: number; y: number } => {
  const scale = zoomScale(zoom, vp, extent)
  const anchorY =
    zoom === 'life'
      ? canvasHeight(extent) / 2
      : zoom === 'near'
        ? // centre the focused fork inside the window, biased to show what came before
          forkTop(focusIndex) + FORK_H * 0.5
        : forkSplit(focusIndex) + (FORK_H - STEM_H) * 0.46
  // 'recent' sits the focused fork low, so the screen fills with what came before it.
  const centreFactor = zoom === 'moment' ? 0.44 : zoom === 'near' ? 0.6 : 0.42
  return {
    scale,
    x: vp.width / 2 - scale * CX,
    y: vp.height * centreFactor - scale * anchorY,
  }
}
