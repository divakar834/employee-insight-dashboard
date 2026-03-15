/**
 * virtualization.js
 * ─────────────────────────────────────────────────────────────────
 * Manual virtualization logic — no third-party library used.
 *
 * WHY VIRTUALIZE?
 * Rendering thousands of DOM nodes at once causes the browser to:
 *   • Use massive amounts of memory
 *   • Paint / layout every row (even off-screen ones)
 *   • Slow down interactions
 *
 * With virtualization we only mount the rows the user can actually see
 * (plus a small buffer for smooth scrolling). The scroll container still
 * has the correct full height, so the native scrollbar behaves normally.
 *
 * MATH:
 *   rowHeight        = height of one table row in px           (e.g. 52)
 *   containerHeight  = visible height of the scroll container  (e.g. 520)
 *
 *   startIndex = Math.floor(scrollTop / rowHeight)
 *      → index of the first row that is at least partially visible
 *
 *   visibleCount = Math.ceil(containerHeight / rowHeight)
 *      → number of rows that fit in the container
 *
 *   endIndex = startIndex + visibleCount + buffer
 *      → a few extra rows pre-rendered below the fold so fast scrolling
 *        doesn't show blank gaps
 *
 *   totalHeight = data.length * rowHeight
 *      → the spacer div gets this height so the scrollbar represents the
 *        full dataset
 *
 *   offsetY = startIndex * rowHeight
 *      → translate the rendered rows down by this amount so they appear
 *        at the correct scroll position
 */

export const ROW_HEIGHT = 52      // px — must match the actual rendered row height
export const BUFFER     = 5       // extra rows above and below the visible window

/**
 * getVisibleRange
 * @param {number} scrollTop       - current scrollTop of the container
 * @param {number} containerHeight - visible height of the container
 * @param {number} totalItems      - total number of data rows
 * @returns {{ startIndex, endIndex, offsetY, totalHeight }}
 */
export function getVisibleRange(scrollTop, containerHeight, totalItems) {
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT)

  // Clamp to valid indices
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER)
  const endIndex   = Math.min(totalItems, startIndex + visibleCount + BUFFER * 2)

  return {
    startIndex,
    endIndex,
    offsetY:     startIndex * ROW_HEIGHT,   // CSS translateY for the rendered block
    totalHeight: totalItems * ROW_HEIGHT,   // full scroll height
  }
}
