/**
 * Canvas geometry for the tree of answers.
 *
 * Rows are forks: row N is fork N, everywhere across the canvas. Columns come
 * from packing the drawn tree, so siblings never collide and a parent sits
 * centred over its children. The shape widens as it is explored.
 */

/** Horizontal pitch between adjacent leaves. Wide enough for an answer card. */
export const SLOT_W = 212
export const SIDE_PAD = 120

/** Vertical distance between one fork and the next. */
export const ROW_H = 400

/** Space at the top of a row for the question card and its prose. */
export const QUESTION_H = 180

export const slotX = (slot: number): number => SIDE_PAD + slot * SLOT_W
export const rowY = (depth: number): number => depth * ROW_H

/** Where an answer's card hangs on its edge. */
export const EDGE_MID = QUESTION_H + (ROW_H - QUESTION_H) * 0.5

export const canvasWidth = (slots: number): number => SIDE_PAD * 2 + Math.max(1, slots) * SLOT_W
export const canvasHeight = (rows: number): number => rows * ROW_H

/** The answer, as a curve from the question down to where it lands. */
export const edgePath = (fromSlot: number, toSlot: number, depth: number): string => {
  const x0 = slotX(fromSlot)
  const x1 = slotX(toSlot)
  const y0 = rowY(depth) + QUESTION_H
  const y1 = rowY(depth + 1)
  const c = (y1 - y0) * 0.42
  return `M ${x0} ${y0} C ${x0} ${y0 + c}, ${x1} ${y1 - c}, ${x1} ${y1}`
}

/** The short vertical above a question, where its incoming answer arrives. */
export const stemPath = (slot: number, depth: number): string =>
  `M ${slotX(slot)} ${rowY(depth)} L ${slotX(slot)} ${rowY(depth) + QUESTION_H}`

/**
 * Where an answer's card sits horizontally.
 *
 * Over the question it leads to, not the midpoint of its edge: a parent is
 * centred between its children, so midpoints are only half a slot apart and the
 * two answer cards overlap each other.
 */
export const answerX = (toSlot: number): number => slotX(toSlot)

/** A short tick above a question, for when the scene prose is open below it. */
export const stemTickPath = (slot: number, depth: number): string =>
  `M ${slotX(slot)} ${rowY(depth)} L ${slotX(slot)} ${rowY(depth) + 8}`

/* ------------------------------------------------------------------ *
 * Zoom
 * ------------------------------------------------------------------ */

export type Zoom = 'moment' | 'near' | 'life'

export interface Viewport {
  width: number
  height: number
}

/** How many rows the middle framing always holds. */
export const RECENT_ROWS = 3

export interface Extent {
  rows: number
  slots: number
}

export const zoomScale = (zoom: Zoom, vp: Viewport, extent: Extent): number => {
  const oneSlot = (vp.width - 24) / SLOT_W
  if (zoom === 'moment') return Math.min(1, oneSlot)
  if (zoom === 'near') return Math.min(oneSlot, (vp.height - 210) / (RECENT_ROWS * ROW_H))
  // 'life' must fit the whole tree: the comparison across a row is what the
  // framing exists for, so width matters as much as depth.
  const fitH = (vp.height - 210) / Math.max(1, canvasHeight(extent.rows))
  const fitW = (vp.width - 24) / canvasWidth(extent.slots)
  return Math.max(0.02, Math.min(fitW, fitH))
}

export const zoomTransform = (
  zoom: Zoom,
  focus: { depth: number; slot: number },
  vp: Viewport,
  extent: Extent,
): { scale: number; x: number; y: number } => {
  const scale = zoomScale(zoom, vp, extent)
  const anchorY =
    zoom === 'life'
      ? canvasHeight(extent.rows) / 2
      : zoom === 'near'
        ? rowY(focus.depth) + ROW_H * 0.5
        : rowY(focus.depth) + QUESTION_H * 0.5
  const anchorX = zoom === 'life' ? canvasWidth(extent.slots) / 2 : slotX(focus.slot)
  // 'recent' sits the focused fork low, so the screen fills with what came before.
  const centreFactor = zoom === 'moment' ? 0.4 : zoom === 'near' ? 0.5 : 0.46
  return {
    scale,
    x: vp.width / 2 - scale * anchorX,
    y: vp.height * centreFactor - scale * anchorY,
  }
}
